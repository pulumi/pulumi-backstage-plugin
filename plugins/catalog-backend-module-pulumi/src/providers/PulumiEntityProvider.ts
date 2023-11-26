import {PluginTaskScheduler, TaskRunner} from '@backstage/backend-tasks';
import {Config} from '@backstage/config';
import {
    EntityProvider,
    EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import {merge} from 'lodash';
import * as uuid from 'uuid';
import {Logger} from 'winston';

import {readPulumiConfigs} from './config';
import {
    Stacks,
    PulumiProviderConfig,
    getStacks, getStack
} from '../pulumi';
import {
    Entity,
    ANNOTATION_LOCATION,
    ANNOTATION_ORIGIN_LOCATION,
    ANNOTATION_SOURCE_LOCATION,
    ResourceEntity
} from "@backstage/catalog-model";
import {
    PULUMI_PROJECT_SLUG_ANNOTATION,
} from '../pulumi/constants';
import {ResourceTransformer} from "../pulumi/types";
import {defaultResourceTransformer} from "../pulumi/transformes";


/** @public */
export class PulumiEntityProvider implements EntityProvider {
    private readonly config: PulumiProviderConfig;
    //private readonly integration: GerritIntegration;
    private readonly logger: Logger;
    private readonly scheduleFn: () => Promise<void>;
    private connection?: EntityProviderConnection;
    private readonly transformer: ResourceTransformer;

    static fromConfig(
        configRoot: Config,
        options: {
            logger: Logger;
            schedule?: TaskRunner;
            scheduler?: PluginTaskScheduler;
            transformer?: ResourceTransformer;
        },
    ): PulumiEntityProvider[] {
        if (!options.schedule && !options.scheduler) {
            throw new Error('Either schedule or scheduler must be provided.');
        }

        const providerConfigs = readPulumiConfigs(configRoot);

        const providers: PulumiEntityProvider[] = [];

        providerConfigs.forEach(providerConfig => {

            if (!options.schedule && !providerConfig.schedule) {
                throw new Error(
                    `No schedule provided neither via code nor config for gerrit-provider:${providerConfig.id}.`,
                );
            }

            const taskRunner =
                options.schedule ??
                options.scheduler!.createScheduledTaskRunner(providerConfig.schedule!);

            const transformer = options.transformer ?? defaultResourceTransformer;

            providers.push(
                new PulumiEntityProvider(
                    providerConfig,
                    options.logger,
                    taskRunner,
                    transformer,
                )
            );
        });
        return providers;
    }

    private constructor(
        config: PulumiProviderConfig,
        logger: Logger,
        taskRunner: TaskRunner,
        transformer: ResourceTransformer
    ) {
        this.config = config;
        this.logger = logger.child({
            target: this.getProviderName(),
        });
        this.scheduleFn = this.createScheduleFn(taskRunner);
        this.transformer = transformer;
    }

    getProviderName(): string {
        return `pulumi-provider:${this.config.id}`;
    }

    async connect(connection: EntityProviderConnection): Promise<void> {
        this.connection = connection;
        await this.scheduleFn();
    }

    private createScheduleFn(taskRunner: TaskRunner): () => Promise<void> {
        return async () => {
            const taskId = `${this.getProviderName()}:refresh`;
            return taskRunner.run({
                id: taskId,
                fn: async () => {
                    const logger = this.logger.child({
                        class: PulumiEntityProvider.prototype.constructor.name,
                        taskId,
                        taskInstanceId: uuid.v4(),
                    });

                    try {
                        await this.refresh(logger);
                    } catch (error) {
                        logger.error(
                            `${this.getProviderName()} refresh failed, ${error}`,
                            error,
                        );
                    }
                },
            });
        };
    }

    async refresh(logger: Logger): Promise<void> {
        if (!this.connection) {
            throw new Error('Pulumi discovery connection not initialized');
        }
        const data: Stacks = await getStacks(this.config, logger);
        const entities: ResourceEntity[] = [];
        for (const stack of data.stacks) {
            const stackDetails = await getStack(this.config, logger, stack.orgName, stack.projectName, stack.stackName)

            const entity = await this.transformer(stackDetails, this.config);
            if (entity) {
                entities.push(entity);
            }
        }

        await this.connection.applyMutation({
            type: 'full',
            entities: [...entities].map(entity => ({
                locationKey: this.getProviderName(),
                entity: withLocations("https://app.pulumi.com/", entity),
            })),
        });
        logger.info(`Found ${entities.length} locations.`);
    }
}

function withLocations(baseUrl: string, entity: Entity): Entity {
    const location = `${baseUrl}/${entity.metadata?.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]}`;

    return merge(
        {
            metadata: {
                annotations: {
                    [ANNOTATION_LOCATION]: `url:${location}`,
                    [ANNOTATION_ORIGIN_LOCATION]: `url:${location}`,
                    [ANNOTATION_SOURCE_LOCATION]: `url:${location}`,
                },
            },
        },
        entity,
    ) as Entity;
}


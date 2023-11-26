import {CatalogBuilder} from '@backstage/plugin-catalog-backend';
import {ScaffolderEntitiesProcessor} from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import {Router} from 'express';
import {PluginEnvironment} from '../types';
import {PulumiEntityProvider} from '@pulumi/plugin-catalog-backend-module-pulumi';

export default async function createPlugin(
    env: PluginEnvironment,
): Promise<Router> {
    const builder = await CatalogBuilder.create(env);

    builder.addEntityProvider(
        PulumiEntityProvider.fromConfig(env.config, {
            logger: env.logger,
            schedule: env.scheduler.createScheduledTaskRunner({
                frequency: {minutes: 30},
                timeout: {minutes: 3},
            }),
            scheduler: env.scheduler,
        }),
    );


    builder.addProcessor(new ScaffolderEntitiesProcessor());
    const {processingEngine, router} = await builder.build();
    await processingEngine.start();
    return router;
}

import {loggerToWinstonLogger} from '@backstage/backend-common';
import {
    coreServices,
    createBackendModule,
} from '@backstage/backend-plugin-api';
import {catalogProcessingExtensionPoint} from '@backstage/plugin-catalog-node/alpha';
import {PulumiEntityProvider} from '../providers/PulumiEntityProvider';


export const catalogModulePulumiEntityProvider = createBackendModule({
    pluginId: 'catalog',
    moduleId: 'pulumi-entity-provider',
    register(env) {
        env.registerInit({
            deps: {
                catalog: catalogProcessingExtensionPoint,
                config: coreServices.rootConfig,
                logger: coreServices.logger,
                scheduler: coreServices.scheduler,
            },
            async init({catalog, config, logger, scheduler}) {
                const winstonLogger = loggerToWinstonLogger(logger);
                const providers = PulumiEntityProvider.fromConfig(config, {
                    logger: winstonLogger,
                    scheduler,
                });

                catalog.addEntityProvider(providers);
            },
        });
    },
});

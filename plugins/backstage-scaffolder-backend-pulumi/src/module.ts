import {
    createBackendModule,
    coreServices,
} from '@backstage/backend-plugin-api';
import {scaffolderActionsExtensionPoint} from '@backstage/plugin-scaffolder-node';
import {pulumiNewAction} from "./actions/pulumiNew";
import {pulumiUpAction} from "./actions/pulumiUp";

export const pulumiModule = createBackendModule({
    moduleId: 'pulumi',
    pluginId: 'scaffolder',
    register({registerInit}) {
        registerInit({
            deps: {
                scaffolderActions: scaffolderActionsExtensionPoint,
                config: coreServices.rootConfig,
            },
            async init({scaffolderActions}) {
                scaffolderActions.addActions(
                    pulumiNewAction(),
                    pulumiUpAction(),
                );
            },
        });
    },
});

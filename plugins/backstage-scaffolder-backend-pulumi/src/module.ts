import {createBackendModule} from '@backstage/backend-plugin-api';
import {scaffolderActionsExtensionPoint} from '@backstage/plugin-scaffolder-node';
import {pulumiNewAction} from "./actions/pulumiNew";
import {pulumiUpAction} from "./actions/pulumiUp";
import {pulumiPreviewAction} from "./actions/pulumiPreview";
import {pulumiDestroyAction} from "./actions/pulumiDestroy";
import {pulumiDeploymentRunAction} from "./actions/pulumiDeploymentRun";
import {pulumiDeploymentConfigAction} from "./actions/pulumiDeploymentConfig";

export const pulumiModule = createBackendModule({
    moduleId: 'pulumi',
    pluginId: 'scaffolder',
    register({registerInit}) {
        registerInit({
            deps: {
                scaffolderActions: scaffolderActionsExtensionPoint,
            },
            async init({scaffolderActions}) {
                scaffolderActions.addActions(
                    pulumiNewAction(),
                    pulumiUpAction(),
                    pulumiPreviewAction(),
                    pulumiDestroyAction(),
                    pulumiDeploymentRunAction(),
                    pulumiDeploymentConfigAction(),
                );
            },
        });
    },
});

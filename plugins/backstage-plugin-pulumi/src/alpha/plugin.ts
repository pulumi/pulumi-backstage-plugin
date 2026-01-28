import { convertLegacyRouteRefs } from '@backstage/core-compat-api';
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';

import { rootRouteRef } from '../routes';

import { pulumiApi } from './apis';
import { entityPulumiCard, entityPulumiMetadataCard } from './entityCards';
import { entityPulumiContent } from './entityContents';
import { pulumiDashboardPage } from './pages';

/**
 * The Pulumi plugin for the new Backstage frontend system.
 *
 * @alpha
 */
const pulumiPlugin = createFrontendPlugin({
  pluginId: 'pulumi',
  info: { packageJson: () => import('../../package.json') },
  extensions: [
    pulumiApi,
    pulumiDashboardPage,
    entityPulumiCard,
    entityPulumiMetadataCard,
    entityPulumiContent,
  ],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});

export { pulumiPlugin };

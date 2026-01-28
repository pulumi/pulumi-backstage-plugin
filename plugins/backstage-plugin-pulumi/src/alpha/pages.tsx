import {
  compatWrapper,
  convertLegacyRouteRef,
} from '@backstage/core-compat-api';
import { PageBlueprint } from '@backstage/frontend-plugin-api';
import { rootRouteRef } from '../routes';

/**
 * Page Extension - Pulumi Dashboard
 *
 * @alpha
 */
export const pulumiDashboardPage: any = PageBlueprint.make({
  params: {
    path: '/pulumi',
    routeRef: convertLegacyRouteRef(rootRouteRef),
    async loader() {
      const { PulumiDashboardPage } = await import(
        '../components/PulumiDashboardPage'
      );
      return compatWrapper(<PulumiDashboardPage />);
    },
  },
});

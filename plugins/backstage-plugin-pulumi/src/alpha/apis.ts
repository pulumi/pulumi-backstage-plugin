import {
  ApiBlueprint,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';

import { pulumiApiRef, PulumiClient } from '../api';

/**
 * API extension for the Pulumi client.
 *
 * @alpha
 */
export const pulumiApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: pulumiApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ configApi, discoveryApi, fetchApi }) {
        return PulumiClient.fromConfig(configApi, { discoveryApi, fetchApi });
      },
    }),
});

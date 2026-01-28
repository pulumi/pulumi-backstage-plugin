import {PulumiClient, pulumiApiRef} from './api';
import {
    createApiFactory,
    createPlugin,
    createComponentExtension,
    createRoutableExtension,
    discoveryApiRef,
    fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';

export const pulumiPlugin = createPlugin({
    id: 'pulumi',
    routes: {
        root: rootRouteRef,
    },
    apis: [
        createApiFactory({
            api: pulumiApiRef,
            deps: {discoveryApi: discoveryApiRef, fetchApi: fetchApiRef},
            factory: ({discoveryApi, fetchApi}) =>
                new PulumiClient({discoveryApi, fetchApi}),
        }),
    ],
});

export const PulumiDashboardPage = pulumiPlugin.provide(
    createRoutableExtension({
        name: 'PulumiDashboardPage',
        component: () =>
            import('./components/PulumiDashboardPage').then(m => m.PulumiDashboardPage),
        mountPoint: rootRouteRef,
    }),
);

export const EntityPulumiCard = pulumiPlugin.provide(
    createComponentExtension({
        name: 'EntityPulumiCard',
        component: {
            lazy: () =>
                import('./components/EntityPulumiCard/EntityPulumiCard').then(m => m.EntityPulumiCard),
        },
    }),
);

export const EntityPulumiMetdataCard = pulumiPlugin.provide(
  createComponentExtension({
      name: 'EntityPulumiMetdataCard',
      component: {
          lazy: () =>
              import('./components/EntityPulumiCard/EntityPulumiCard').then(m => m.EntityPulumiMetdataCard),
      },
  }),
);

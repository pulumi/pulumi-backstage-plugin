import {PulumiClient, pulumiApiRef} from './api';
import {
    createApiFactory,
    createPlugin,
    createComponentExtension,
    discoveryApiRef,
    fetchApiRef,
} from '@backstage/core-plugin-api';

export const pulumiPlugin = createPlugin({
    id: 'pulumi',
    apis: [
        createApiFactory({
            api: pulumiApiRef,
            deps: {discoveryApi: discoveryApiRef, fetchApi: fetchApiRef},
            factory: ({discoveryApi, fetchApi}) =>
                new PulumiClient({discoveryApi, fetchApi}),
        }),
    ],
});

/*
export const PulumiPage = pulumiPlugin.provide(
  createRoutableExtension({
    name: 'PulumiPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
*/

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

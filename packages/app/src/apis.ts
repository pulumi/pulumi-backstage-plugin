import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory, discoveryApiRef, fetchApiRef, identityApiRef,
} from '@backstage/core-plugin-api';
import {ScaffolderClient} from "@backstage/plugin-scaffolder";
import {scaffolderApiRef} from "@backstage/plugin-scaffolder-react";
export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  createApiFactory({
    api: scaffolderApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      identityApi: identityApiRef,
      scmIntegrationsApi: scmIntegrationsApiRef,
      fetchApi: fetchApiRef,
    },
    factory: ({ scmIntegrationsApi, discoveryApi, identityApi, fetchApi }) =>
        new ScaffolderClient({
          discoveryApi,
          identityApi,
          scmIntegrationsApi,
          fetchApi,
          useLongPollingLogs: true,
        }),
  }),
  ScmAuth.createDefaultApiFactory(),
];

/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import {createBackend} from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));
// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider
// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend/alpha'));

backend.add(import('@pulumi/plugin-catalog-backend-module-pulumi/alpha'));

backend.add(
    import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend/alpha'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
    import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend/alpha'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg/alpha'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend/alpha'));

// Pulumi
backend.add(import('@pulumi/backstage-scaffolder-backend-pulumi'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));

backend.start();

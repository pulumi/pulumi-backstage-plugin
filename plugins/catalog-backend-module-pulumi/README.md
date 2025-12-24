# Catalog Backend Module for Pulumi

This is an extension module to the `plugin-catalog-backend` plugin, providing an `PulumiEntityProvider` that can be used to ingest
[Resource entities](https://backstage.io/docs/features/software-catalog/descriptor-format#kind-resource) from the
[Pulumi Cloud](https://app.pulumi.com/). This provider is useful if you want to import Pulumi stacks into Backstage.

## Installation

The provider is not installed by default, therefore you have to add a dependency to `@pulumi/plugin-catalog-backend-module-pulumi`
to your backend package:

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @pulumi/plugin-catalog-backend-module-pulumi
```

Update the catalog plugin initialization in your backend to add the provider using the new Backstage Backend System:

```typescript
//packages/backend/src/index.ts
backend.add(import('@pulumi/plugin-catalog-backend-module-pulumi/alpha'));
```

After this, you also have to add some configuration in your app-config that describes what you want to import for that target.

## Configuration

The following configuration is an example of how a setup could look for importing stacks from Pulumi Cloud:

```yaml
catalog:
  providers:
    pulumi:
      default:
        api: https://api.pulumi.com
        organization: <your organization>
        pulumiAccessToken: ${PULUMI_ACCESS_TOKEN}
        schedule:
          frequency: PT10M
          timeout: PT50M
```

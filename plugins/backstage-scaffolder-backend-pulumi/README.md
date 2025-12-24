## Pulumi Scaffolder Backend Module

### Getting Started

You need to configure the action in your backend:

### From your Backstage root directory

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @pulumi/backstage-scaffolder-backend-pulumi
```

Configure the action using the new Backstage Backend System:

```typescript
// packages/backend/src/index.ts
const backend = createBackend();
backend.add(import('@pulumi/backstage-scaffolder-backend-pulumi'));
```

### PULUMI_ACCESS_TOKEN

You need to set the `PULUMI_ACCESS_TOKEN` environment variable to be able to use the Pulumi action.

### Pulumi New Action

The Pulumi New Action is a custom action that allows you to create a new Pulumi project from a template.

`pulumi:new`

| Input        | Description                                                                        | Type          | Required |
|--------------|------------------------------------------------------------------------------------|---------------|----------|
| stack        | The Pulumi stack to use                                                            | string        | Yes      |
| organization | The Pulumi organization to use for the Pulumi commands                             | string        | Yes      |
| name         | The Pulumi project name to use                                                     | string        | Yes      |
| template     | The Pulumi template to use, this can be a built-in template or a URL to a template | string        | Yes      |
| description  | The Pulumi project description to use                                              | string        | Yes      |
| config       | The Pulumi project config to use                                                   | object        | No       |
| secretConfig | The Pulumi project secret config to use                                            | object        | No       |
| args         | The Pulumi command arguments to run                                                | array(string) | No       |
| folder       | The folder to run Pulumi in                                                        | string        | Yes      |

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: kubernetes-template
  title: Kubernetes Cluster
  description: |
    A template for creating a new Kubernetes Cluster.
  tags:
    - pulumi
    - kubernetes
spec:
  steps:
    - id: pulumi-new-component
      name: Cookie cut the component Pulumi project
      action: pulumi:new
      input:
        name: "${{ parameters.component_id }}-infrastructure"
        description: ${{ parameters.description | dump }}
        organization: ediri
        stack: ${{ parameters.stack }}
        template: "https://github.com/my-silly-organisation/microservice-civo/tree/main/infrastructure-${{ parameters.cloud }}-${{ parameters.language }}"
        config:
          "node:node_count": "${{ parameters.nodeCount }}"
        folder: .
```

### Pulumi Up Action

The Pulumi Up Action is a custom action that allows you to run the `pulumi up` command.

`pulumi:up`

| Input                      | Description                                                         | Type          | Required |
|----------------------------|---------------------------------------------------------------------|---------------|----------|
| stack                      | The Pulumi stack to use                                             | string        | Yes      |
| organization               | The Pulumi organization to use for the Pulumi commands              | string        | Yes      |
| name                       | The Pulumi project name to use                                      | string        | Yes      |
| deployment                 | This flag indicates that Pulumi Deployment will be used             | boolean       | Yes      |
| config                     | The Pulumi project config to use                                    | object        | No       |
| secretConfig               | The Pulumi project secret config to use                             | object        | No       |
| outputs                    | The Pulumi project outputs to return                                | array(string) | No       |
| repoUrl                    | The Pulumi project repo URL to use, when using Pulumi Deployment    | string        | No       |
| repoBranch                 | The Pulumi project repo branch to use, when using Pulumi Deployment | string        | No       |
| repoProjectPath            | The Pulumi project repo path to use, when using Pulumi Deployment   | string        | No       |
| providerCredentialsFromEnv | The Pulumi project provider credentials to use                      | array(string) | No       |

The action offers also Pulumi deployment support, to use it you need to set the `deployment` input to `true`. If you did
not set any `config` or `secretConfig`, during the `pulumi:new` action, you need to set them here. If you have any
provider related credentials, you need to set the `providerCredentialsFromEnv` input.

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: kubernetes-template
  title: Kubernetes Cluster
  description: |
    A template for creating a new Kubernetes Cluster.
  tags:
    - pulumi
    - kubernetes
spec:
  steps:
    - id: pulumi-deploy-infrastructure
      name: Deploy the infrastructure using Pulumi CLI
      action: pulumi:up
      input:
        deployment: false
        name: "${{ parameters.component_id }}-infrastructure"
        repoUrl: "https://github.com/${{ (parameters.repoUrl | parseRepoUrl)['owner'] }}/${{ (parameters.repoUrl | parseRepoUrl)['repo'] }}"
        repoProjectPath: .
        organization: ediri
        outputs:
          - kubeconfig
          - ClusterId
        stack: ${{ parameters.stack }}
```

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
| preRunCommands             | Commands to execute before running pulumi up                        | array(string) | No       |
| environments               | ESC environments to add to the stack                                | array(string) | No       |

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

### Pulumi Preview Action

The Pulumi Preview Action allows you to preview changes without deploying.

`pulumi:preview`

| Input            | Description                                          | Type          | Required |
|------------------|------------------------------------------------------|---------------|----------|
| stack            | The Pulumi stack to use                              | string        | Yes      |
| organization     | The Pulumi organization to use                       | string        | Yes      |
| name             | The Pulumi project name to use                       | string        | Yes      |
| config           | The Pulumi project config to use                     | object        | No       |
| secretConfig     | The Pulumi project secret config to use              | object        | No       |
| repoProjectPath  | The Pulumi project repo path to use                  | string        | No       |
| preRunCommands   | Commands to execute before running preview           | array(string) | No       |
| environments     | ESC environments to add to the stack                 | array(string) | No       |
| expectNoChanges  | Return an error if any changes are proposed          | boolean       | No       |
| refresh          | Refresh the stack state before preview (default: true)| boolean      | No       |

**Output:** `changeSummary` - Summary of proposed changes by operation type.

```yaml
steps:
  - id: pulumi-preview
    name: Preview infrastructure changes
    action: pulumi:preview
    input:
      name: my-infrastructure
      organization: my-org
      stack: dev
      repoProjectPath: .
      environments:
        - my-org/my-esc-env
```

### Pulumi Destroy Action

The Pulumi Destroy Action allows you to destroy stack resources. **Requires explicit confirmation.**

`pulumi:destroy`

| Input            | Description                                          | Type          | Required |
|------------------|------------------------------------------------------|---------------|----------|
| stack            | The Pulumi stack to use                              | string        | Yes      |
| organization     | The Pulumi organization to use                       | string        | Yes      |
| name             | The Pulumi project name to use                       | string        | Yes      |
| confirm          | Safety flag - must be set to true to execute destroy | boolean       | Yes      |
| repoProjectPath  | The Pulumi project repo path to use                  | string        | No       |
| preRunCommands   | Commands to execute before running destroy           | array(string) | No       |
| environments     | ESC environments to add to the stack                 | array(string) | No       |
| removeStack      | Remove the stack after destroying resources          | boolean       | No       |
| targetUrns       | Specific resource URNs to destroy                    | array(string) | No       |

**Output:** `summary` - Summary of destroyed resources by operation type.

```yaml
steps:
  - id: pulumi-destroy
    name: Destroy infrastructure
    action: pulumi:destroy
    input:
      name: my-infrastructure
      organization: my-org
      stack: dev
      confirm: true  # Required safety flag
      removeStack: true  # Optionally remove the stack after destroy
```

### Pulumi Deployment Config Action

The Pulumi Deployment Config Action configures Pulumi Deployments settings via the Pulumi Cloud REST API.

`pulumi:deployment:config`

| Input            | Description                                          | Type          | Required |
|------------------|------------------------------------------------------|---------------|----------|
| organization     | The Pulumi organization                              | string        | Yes      |
| project          | The Pulumi project name                              | string        | Yes      |
| stack            | The Pulumi stack name                                | string        | Yes      |
| sourceContext    | Git source configuration                             | object        | No       |
| operationContext | Operation context (env vars, OIDC, options)          | object        | No       |
| github           | GitHub integration settings                          | object        | No       |
| cacheOptions     | Cache options for deployments                        | object        | No       |
| executorContext  | Executor context configuration                       | object        | No       |

**Outputs:**
- `settingsUrl` - URL to view deployment settings in Pulumi Cloud
- `configured` - Whether settings were successfully configured

```yaml
steps:
  - id: configure-deployment
    name: Configure Pulumi Deployments
    action: pulumi:deployment:config
    input:
      organization: my-org
      project: my-project
      stack: dev
      sourceContext:
        git:
          repoUrl: https://github.com/my-org/my-repo
          branch: main
          repoDir: infrastructure
      operationContext:
        preRunCommands:
          - npm install
        oidc:
          aws:
            roleArn: arn:aws:iam::123456789:role/pulumi-deploy
      github:
        repository: my-org/my-repo
        deployCommits: true
        previewPullRequests: true
```

### Pulumi Deployment Run Action

The Pulumi Deployment Run Action triggers a Pulumi Deployment via the Pulumi Cloud REST API.

`pulumi:deployment:run`

| Input            | Description                                                      | Type    | Required |
|------------------|------------------------------------------------------------------|---------|----------|
| organization     | The Pulumi organization                                          | string  | Yes      |
| project          | The Pulumi project name                                          | string  | Yes      |
| stack            | The Pulumi stack name                                            | string  | Yes      |
| operation        | The operation to run (update, preview, refresh, destroy, detect-drift) | string | Yes      |
| inheritSettings  | Inherit deployment settings from stack configuration (default: true) | boolean | No       |
| operationContext | Override operation context settings                              | object  | No       |
| sourceContext    | Override source context settings                                 | object  | No       |

**Outputs:**
- `deploymentId` - The ID of the triggered deployment
- `deploymentUrl` - URL to view the deployment in Pulumi Cloud
- `version` - The deployment version number

```yaml
steps:
  - id: trigger-deployment
    name: Trigger Pulumi Deployment
    action: pulumi:deployment:run
    input:
      organization: my-org
      project: my-project
      stack: prod
      operation: update
      inheritSettings: true
```

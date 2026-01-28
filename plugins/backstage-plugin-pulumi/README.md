## Pulumi Plugin

- Display relevant Pulumi information about an entity within Backstage, such as the Pulumi stack, organization, project
  name, and project description.
- Show stack outputs directly in the Pulumi card (e.g., URLs, resource IDs, connection strings).
- Show the Pulumi activity view for an entity within Backstage.
- **Pulumi Dashboard**: A standalone dashboard page showing organization-wide metrics, recent stack updates, deployments, and resource trends.

### Requirements

- Setup of the Pulumi plugin for Backstage requires a Pulumi Organization admin to generate a Pulumi access token for
  the Backstage application.

### Feature Overview

#### Pulumi Card (Component Overview)

<img src="doc/component.png" width="500">

#### Pulumi Card (System Overview)

<img src="doc/system.png" width="500">

#### Pulumi Activity View

<img src="doc/activity.png" width="500">

#### Pulumi Dashboard

The Pulumi Dashboard provides an organization-wide view of your Pulumi infrastructure:

- **Organization Selector**: Switch between Pulumi organizations you have access to
- **Stats Cards**: View counts for Members, Stacks, ESC Environments, and Resources
- **Latest Stack Updates**: See recent stack activity with status, timing, and resource changes
- **Latest Deployments**: Monitor recent Pulumi Deployments with status and links
- **Resource Trends**: Interactive chart showing resource count over time with configurable time ranges and CSV export

### Support

If you need any help with this plugin, feel free to reach out to me!

### Integration Walk-through

#### Install the plugin

The file paths mentioned in the following steps are relative to your app's root directory — for example, the directory
created by following the [Getting Started](https://backstage.io/docs/getting-started/) guide and creating your app with
`npx @backstage/create-app`.

First, install the Pulumi plugin via a CLI:

```bash
# From your Backstage root directory
yarn add --cwd packages/app @pulumi/backstage-plugin-pulumi
```

Next, add the plugin to `EntityPage.tsx` in `packages/app/src/components/catalog` by adding the following code snippets.

Add the following imports to the top of the file:

```tsx
import {
    isPulumiAvailable,
    EntityPulumiCard,
    EntityPulumiMetdataCard,
    PulumiComponent,
    PulumiDashboardPage,
} from '@pulumi/backstage-plugin-pulumi';
```

Then create a new constant for the Pulumi Component:

```tsx
const pulumiContent = (
    <EntitySwitch>
        <EntitySwitch.Case if={isPulumiAvailable}>
            <PulumiComponent/>
        </EntitySwitch.Case>
    </EntitySwitch>
);
```

Find const `overviewContent` in `EntityPage.tsx`, and add the following snippet inside the outermost Grid defined there,
just before the closing `</Grid>` tag:

```tsx
<EntitySwitch>
    <EntitySwitch.Case if={isPulumiAvailable}>
        <Grid item md={6}>
            <EntityPulumiCard variant="gridItem"/>
        </Grid>
    </EntitySwitch.Case>
</EntitySwitch>
```

Now find the `serviceEntityPage` constant in `EntityPage.tsx`, and add the following snippet inside:

```tsx
<EntityLayout.Route path="/pulumi" title="Pulumi" if={isPulumiAvailable}>
    {pulumiContent}
</EntityLayout.Route>
```

#### Add the Pulumi Dashboard Page (Optional)

To add the standalone Pulumi Dashboard page, add a route in your `App.tsx`:

```tsx
import { PulumiDashboardPage } from '@pulumi/backstage-plugin-pulumi';

// In your routes
<Route path="/pulumi" element={<PulumiDashboardPage />} />
```

You can also add a sidebar navigation item in your `Root.tsx`:

```tsx
<SidebarItem icon={YourIcon} to="pulumi" text="Pulumi" />
```

Lastly, find the `systemPage` constant in `EntityPage.tsx`, and add the following snippet inside after the
closing `</Grid>` tag of the `<EntityAboutCard variant="gridItem" />`:

```tsx
  <EntitySwitch>
    <EntitySwitch.Case if={isPulumiAvailable}>
        <Grid item md={6}>
            <EntityPulumiMetdataCard/>
        </Grid>
    </EntitySwitch.Case>
</EntitySwitch>
```

#### Configure the plugin

First, annotate your component/resource entity with the following:

```yaml
annotations:
  pulumi.com/project-slug: <org/project/stack>
```

You can also specify multiple stacks using comma-separated values:

```yaml
annotations:
  # Multiple stacks - displays as tabs in the UI
  pulumi.com/project-slug: acme/web-app/prod,acme/web-app/staging,acme/api/prod
```

And your system entity with the following:

```yaml
annotations:
  pulumi.com/orga-slug: <org>
```

You can also specify multiple organizations using comma-separated values:

```yaml
annotations:
  # Multiple organizations - displays as tabs in the UI
  pulumi.com/orga-slug: acme,widgets-inc
```

Next, provide the API token that the client will use to make requests to the Pulumi Cloud API.

Add the proxy configuration in `app-config.yaml`:

```yaml
proxy:
  '/pulumi':
    target: 'https://api.pulumi.com/api'
    changeOrigin: true
    headers:
      Authorization: token ${PULUMI_ACCESS_TOKEN}
      Accept: application/vnd.pulumi+8
      Content-Type: application/json
```

Then, start the backend, passing the Pulumi Access Token as an environment variable:

```bash
export PULUMI_ACCESS_TOKEN='<PULUMI_ACCESS_TOKEN>' 
yarn start
```

This will proxy the request by adding an `Authorization` header with the provided token.

### New Frontend System

This plugin supports the new Backstage frontend system. Follow these steps to use it in an application that supports the new frontend system.

#### Package Detection

Once you install the `@pulumi/backstage-plugin-pulumi` package, you can choose how the package should be detected by the app. The package can be automatically discovered when the feature discovery config is set, or it can be manually enabled via code.

<table>
  <tr>
    <td>Via config</td>
    <td>Via code</td>
  </tr>
  <tr>
    <td>
      <pre lang="yaml">
# app-config.yaml
app:
  # Enable package discovery for all plugins
  packages: 'all'
---
app:
  # Enable package discovery only for Pulumi
  packages:
    include:
      - '@pulumi/backstage-plugin-pulumi'
      </pre>
    </td>
    <td>
      <pre lang="typescript">
// packages/app/src/App.tsx
import { createApp } from '@backstage/frontend-defaults';
import pulumiPlugin from '@pulumi/backstage-plugin-pulumi/alpha';

const app = createApp({
  features: [
    // ...other plugins
    pulumiPlugin,
  ],
});
      </pre>
    </td>
  </tr>
</table>

#### Extensions Configuration

The plugin installs the following extensions:

| Extension | Kind | Description |
|-----------|------|-------------|
| `api:pulumi` | API | Pulumi API client for communicating with Pulumi Cloud |
| `page:pulumi` | Page | Standalone Pulumi Dashboard page at `/pulumi` |
| `entity-card:pulumi/stack` | Entity Card | Shows stack information, outputs, and metadata |
| `entity-card:pulumi/metadata` | Entity Card | Shows organization metadata and resources by provider |
| `entity-content:pulumi/activity` | Entity Content | Shows Pulumi activity/updates in an entity tab |

You can configure these extensions in your `app-config.yaml`:

```yaml
# app-config.yaml
app:
  extensions:
    # Disable the Pulumi stack card
    - entity-card:pulumi/stack: false

    # Disable the Pulumi metadata card
    - entity-card:pulumi/metadata: false

    # Disable the Pulumi entity content tab
    - entity-content:pulumi/activity: false

    # Customize the Pulumi entity content path and title
    - entity-content:pulumi/activity:
        config:
          path: '/infrastructure'
          title: 'Infrastructure'

    # Customize the Pulumi dashboard page path
    - page:pulumi:
        config:
          path: '/infrastructure-dashboard'
```

#### How to Uninstall

1. Remove any configuration added in Backstage yaml files, such as the proxy configuration in `app-config.yaml` and the integration key in an entity's annotations.
1. Remove the added code snippets from `EntityPage.tsx`
1. Remove the plugin package:

```bash
# From your Backstage root directory
yarn remove --cwd packages/app @pulumi/backstage-plugin-pulumi
```

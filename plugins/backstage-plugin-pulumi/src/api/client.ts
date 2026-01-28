import {createApiRef, ConfigApi} from '@backstage/core-plugin-api';
import {
    PulumiApi,
    PulumiClientApiDependencies,
    PulumiClientApiConfig,
    Stack,
    StackUpdate,
    PulumiMetadata,
    Dashboard,
    ProjectDetail,
    StackPreview,
    StackOutputs
} from './types';
import {NotFoundError} from '@backstage/errors';

export class UnauthorizedError extends Error {
}

export const pulumiApiRef = createApiRef<PulumiApi>({
    id: 'plugin.pulumi.api',
});

export class PulumiClient implements PulumiApi {
    static fromConfig(
        _configApi: ConfigApi,
        dependencies: PulumiClientApiDependencies,
    ) {
        const {discoveryApi, fetchApi} = dependencies;

        return new PulumiClient({
            discoveryApi,
            fetchApi,
        });
    }

    constructor(private readonly config: PulumiClientApiConfig) {
    }


    // /api/stacks/{organization}/{project}/{stack}
    async getStack(
        slug: string,
    ): Promise<Stack> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/stacks/${slug}`;

        const stacks = await this.request(response, {
            method: 'GET',
        })
        return stacks.json();
    }

    // /api/stacks/{organization}/{project}/{stack}/updates
    async listStackUpdates(
            slug: string, 
            page: number,
            pageSize: number
        ): Promise<StackUpdate> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/stacks/${slug}/activity?output-type=service&pageSize=${pageSize}&page=${page}`;



        const updates = await this.request(response, {
            method: 'GET',
        })
        return updates.json();
    }

    // api/stacks/{organization}/{project}/{stack}/updates/latest/previews
    async getPreviews(slug: string): Promise<StackPreview> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/stacks/${slug}/updates/latest/previews`;
        
        const preview = await this.request(response, {
            method: 'GET',
        })
        return preview.json();
    }

    // /api/orgs/{organization}/metadata
    async getMetadata(slug: string): Promise<PulumiMetadata> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/orgs/${slug}/metadata`;
        const metadata = await this.request(response, {
            method: 'GET',
        })
        return metadata.json();
    }

    // api/orgs/{organization}/search/resourcesv2 - compute aggregations from resources
    async getDasboard(slug: string, facet: string, top: number): Promise<Dashboard> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/orgs/${slug}/search/resourcesv2?size=500`;
        const result = await this.request(response, {
            method: 'GET',
        });
        const data = await result.json();

        // Compute aggregations from resources
        const resources = data.resources || [];
        const counts: Record<string, number> = {};

        for (const resource of resources) {
            const key = resource[facet] || 'unknown';
            counts[key] = (counts[key] || 0) + 1;
        }

        // Sort by count and take top N
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        const topResults = sorted.slice(0, top);
        const othersCount = sorted.slice(top).reduce((sum, [, count]) => sum + count, 0);

        return {
            total: data.total || 0,
            aggregations: {
                [facet]: {
                    others: othersCount,
                    results: topResults.map(([name, count]) => ({ name, count })),
                },
            },
        };
    }

    // /api/console/orgs/{organization}/projects/{name}
    async getProjectDetails(org:string,slug: string): Promise<ProjectDetail> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/console/orgs/${org}/projects/${slug}`;
        const project = await this.request(response, {
            method: 'GET',
        })
        return project.json();
    }

    // /api/stacks/{organization}/{project}/{stack}/export
    async getStackOutputs(slug: string): Promise<StackOutputs> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/stacks/${slug}/export`;
        const result = await this.request(response, {
            method: 'GET',
        });
        const data = await result.json();

        // Extract outputs from the stack export
        // The outputs are in the deployment.resources array, in the resource with type "pulumi:pulumi:Stack"
        const outputs: StackOutputs = {};
        const deployment = data.deployment;
        if (deployment?.resources) {
            const stackResource = deployment.resources.find(
                (r: { type: string }) => r.type === 'pulumi:pulumi:Stack'
            );
            if (stackResource?.outputs) {
                for (const [key, value] of Object.entries(stackResource.outputs)) {
                    // Check if the value is a secret (wrapped in { "4dabf18193072939515e22adb298388d": "...", "ciphertext": "..." })
                    const isSecret = typeof value === 'object' &&
                        value !== null &&
                        '4dabf18193072939515e22adb298388d' in (value as Record<string, unknown>);
                    outputs[key] = {
                        secret: isSecret,
                        value: isSecret ? '[secret]' : value,
                    };
                }
            }
        }
        return outputs;
    }

    private async request(
        url: string,
        options: RequestInit,
    ): Promise<Response> {
        const response = await this.config.fetchApi.fetch(url, options);

        if (response.status === 401) {
            throw new UnauthorizedError();
        }

        if (response.status === 404) {
            throw new NotFoundError();
        }

        if (!response.ok) {
            const payload = await response.json();
            const errors = payload.errors.map((error: string) => error).join(' ');
            const message = `Request failed with ${response.status}, ${errors}`;
            throw new Error(message);
        }
        return response;
    }
}

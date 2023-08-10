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
    StackPreview
} from './types';
import {NotFoundError} from '@backstage/errors';

export class UnauthorizedError extends Error {
}

export const pulumiApiRef = createApiRef<PulumiApi>({
    id: 'plugin.pulumi.api',
});

export class PulumiClient implements PulumiApi {
    static fromConfig(
        configApi: ConfigApi,
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

    // api/orgs/{organization}/search/resources/dashboard?facet=package&top=5
    async getDasboard(slug: string, facet: string, top: number): Promise<Dashboard> {
        const response = `${await this.config.discoveryApi.getBaseUrl(
            'proxy',
        )}/pulumi/orgs/${slug}/search/resources/dashboard?facet=${facet}&top=${top}`;
        const dashboard = await this.request(response, {
            method: 'GET',
        })
        return dashboard.json();
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

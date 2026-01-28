import {DiscoveryApi, FetchApi} from '@backstage/core-plugin-api';

export type Stack = {
    orgName: string;
    projectName: string;
    stackName: string;
    tags: Record<string, string>;
    version: string;
};

export type StackUpdate = {
    activity: Update[];
    itemsPerPage: number;
    total: number;
}

export type StackPreview = {
    updates: Update[];
    itemsPerPage: number;
    total: number;
}

export type Update = {
    update: Info;
    info: Info;
    updateID: string;
    githubCommitInfo: GithubCommitInfo;
    id:            string;
    created:       Date;
    modified:      Date;
    version:       number;
    requestedBy:   RequestedBy;
    latestVersion: number;
    updates:       Update[];
}

export type GithubCommitInfo = {
    slug: string;
    sha: string;
    url: string;
    author: RequestedBy;
}

export type RequestedBy = {
    name: string;
    githubLogin: string;
    avatarUrl: string;
}

export type ResourceChanges = {
    create: number;
    update: number;
    same: number;
    delete: number;
}


export type Info = {
    kind: string;
    startTime: number;
    message: string;
    environment: Record<string, string>;
    config: Record<string, string>;
    result: string;
    endTime: number;
    version: number;
    resourceChanges: ResourceChanges;
}

export type PulumiClientApiDependencies = {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
};

export type PulumiClientApiConfig = PulumiClientApiDependencies & {};

export type PulumiMetadata = {
    id: string;
    product: string;
    subscriptionStatus: string;
    features: Record<string, boolean>;
    stackCount: number;
    memberCount: number;
};

export type Dashboard = {
    total: number;
    aggregations: {
        [key: string]: {
            others: number;
            results: {
                name: string;
                count: number;
            }[];
        }
    };
}

export type SystemCard = {
    metadata: PulumiMetadata;
    dashboard: Dashboard;
}

export type Project = {
    repoName: string;
    runtime: string;
}

export type ProjectDetail = {
    project: Project;
}

export type StackOutputValue = {
    secret: boolean;
    value: unknown;
}

export type StackOutputs = Record<string, StackOutputValue>;

export type User = {
    githubLogin: string;
    name: string;
    email: string;
    avatarUrl: string;
    organizations: UserOrganization[];
};

export type UserOrganization = {
    name: string;
    githubLogin?: string;
    avatarUrl?: string;
    // Some Pulumi API responses use 'login' instead of 'githubLogin'
    login?: string;
};

export type Deployment = {
    id: string;
    created: string;
    modified: string;
    status: string;
    version: number;
    requestedBy: {
        name: string;
        githubLogin: string;
        avatarUrl: string;
    };
    projectName: string;
    stackName: string;
};

export type DeploymentList = {
    deployments: Deployment[];
    itemsPerPage: number;
    total: number;
};

export type UserStack = {
    orgName: string;
    projectName: string;
    stackName: string;
    lastUpdate?: number;
    resourceCount?: number;
};

export type UserStackList = {
    stacks: UserStack[];
    continuationToken?: string;
};

export type ResourceSummaryPoint = {
    year: number;
    month?: number;
    day?: number;
    hour?: number;
    weekNumber?: number;
    resources: number;
};

export type ResourceSummary = {
    summary: ResourceSummaryPoint[];
};

export type EscEnvironment = {
    organization: string;
    project: string;
    name: string;
    created: string;
    modified: string;
};

export type EscEnvironmentList = {
    environments: EscEnvironment[];
};

export interface PulumiApi {
    getStack(
        slug: string,
    ): Promise<Stack>;

    listStackUpdates(
        slug: string,
        page: number,
        pageSize: number,
    ): Promise<StackUpdate>;

    getMetadata(
        slug: string,
    ): Promise<PulumiMetadata>;

    getDasboard(
        slug: string,
        facet: string,
        top: number,
    ): Promise<Dashboard>;

    getProjectDetails(
        org: string,
        slug: string,
    ): Promise<ProjectDetail>;

    getPreviews(
        slug: string,
    ): Promise<StackPreview>;

    getStackOutputs(
        slug: string,
    ): Promise<StackOutputs>;

    getCurrentUser(): Promise<User>;

    listDeployments(
        org: string,
        page?: number,
        pageSize?: number,
    ): Promise<DeploymentList>;

    listUserStacks(
        org?: string,
    ): Promise<UserStackList>;

    getResourceHistory(
        org: string,
        granularity: string,
        lookbackDays: number,
    ): Promise<ResourceSummary>;

    listEscEnvironments(
        org: string,
    ): Promise<EscEnvironmentList>;
}

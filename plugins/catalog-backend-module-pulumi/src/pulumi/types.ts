import {TaskScheduleDefinition} from '@backstage/backend-tasks';
import { ResourceEntity } from "@backstage/catalog-model";

export type ResourceTransformer = (
    stackDetail: StackDetail,
    config: PulumiProviderConfig,
) => Promise<ResourceEntity | undefined>;

export type PulumiProviderConfig = {
    api: string;
    organization: string;
    pulumiAccessToken: string;
    id: string;
    schedule?: TaskScheduleDefinition;
};

export type User = {
    name: string;
    githubLogin: string;
    avatarUrl: string;
};

export type Member = {
    role: string;
    user: User;
    created: string;
    knownToPulumi: boolean;
    virtualAdmin: boolean;
};

export type Organization = {
    members: Member[];
};

export type Stack = {
    orgName: string;
    projectName: string;
    stackName: string;
    lastUpdate?: number;
    resourceCount?: number;
};

export type Stacks = {
    stacks: Stack[];
    continuationToken: string;
};

export type StackDetail = {
    orgName: string;
    projectName: string;
    stackName: string;
    activeUpdate: string;
    tags: { [key: string]: string };
    version: number;
}

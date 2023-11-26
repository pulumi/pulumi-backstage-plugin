import {ResourceTransformer, StackDetail} from './types';
import {ResourceEntity, DEFAULT_NAMESPACE} from '@backstage/catalog-model';
import {GITHUB_PROJECT_SLUG_ANNOTATION, PULUMI_PROJECT_SLUG_ANNOTATION} from "./constants";

export const defaultResourceTransformer: ResourceTransformer = async (
    stackDetail,
    _config,
): Promise<ResourceEntity | undefined> => {

    const gitHubOwner = stackDetail.tags["gitHub:owner"];
    const gitHubRepo = stackDetail.tags["gitHub:repo"];

    return {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: {
            name: stackDetail.projectName,
            description: stackDetail.tags["pulumi:description"],
            namespace: DEFAULT_NAMESPACE,
            annotations: {
                [GITHUB_PROJECT_SLUG_ANNOTATION]: `${gitHubOwner}/${gitHubRepo}`,
                [PULUMI_PROJECT_SLUG_ANNOTATION]: `${stackDetail.orgName}/${stackDetail.projectName}/${stackDetail.stackName}`,
            },
            tags: filterTags(stackDetail),
        },
        spec: {
            type: 'service',
            owner: 'pulumi',
        },
    }
}

function filterTags(projectInfo: StackDetail): string[] {
    if (!projectInfo.tags) {
        return [];
    }

    const filteredTags: string[] = [];
    const regex = /^[a-z0-9+#]+$/;
    for (const key in projectInfo.tags) {
        if (projectInfo.tags.hasOwnProperty(key)) {
            const colonIndex = key.indexOf(':');
            const newKey = colonIndex !== -1 ? key.substring(colonIndex + 1) : key;

            if (regex.test(newKey) && regex.test(projectInfo.tags[key])) {
                filteredTags.push(`${newKey}:${projectInfo.tags[key]}`);
            }
        }
    }

    return filteredTags
}

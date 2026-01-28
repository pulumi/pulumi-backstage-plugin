import {Logger} from "winston";
import {PulumiProviderConfig, StackDetail, Stacks} from "./index";

// Helper function for fetch requests
async function fetchFromPulumi(url: string, config: PulumiProviderConfig, logger: Logger): Promise<Response> {
    try {
        return await fetch(url, {
            method: 'GET',
            headers: {
                "Authorization": `token ${config.pulumiAccessToken}`,
                "Accept": "application/vnd.pulumi+8",
                "Content-Type": "application/json"
            },
        });
    } catch (error) {
        logger.error(`Failed to fetch ${url}, ${error}`);
        throw error;
    }
}

export async function getStacks(config: PulumiProviderConfig, logger: Logger): Promise<Stacks> {
    const organisationUrl = `${config.api}/api/user/stacks?organization=${config.organization}`;
    const response = await fetchFromPulumi(organisationUrl, config, logger);
    if (!response.ok) {
        const text = await response.text();
        logger.error(`Failed to fetch stacks from ${organisationUrl}: ${response.status} ${response.statusText} - ${text.substring(0, 200)}`);
        throw new Error(`Failed to fetch stacks: ${response.status} ${response.statusText}`);
    }
    return await response.json() as Stacks;
}

export async function getStack(config: PulumiProviderConfig, logger: Logger, orgName: string, projectName: string, stackName: string): Promise<StackDetail | null> {
    const stackUrl = `${config.api}/api/stacks/${orgName}/${projectName}/${stackName}`;
    const response = await fetchFromPulumi(stackUrl, config, logger);
    if (!response.ok) {
        if (response.status === 404) {
            logger.warn(`Stack not found: ${orgName}/${projectName}/${stackName}`);
            return null;
        }
        const text = await response.text();
        logger.error(`Failed to fetch stack from ${stackUrl}: ${response.status} ${response.statusText} - ${text.substring(0, 200)}`);
        throw new Error(`Failed to fetch stack: ${response.status} ${response.statusText}`);
    }
    return await response.json() as StackDetail;
}

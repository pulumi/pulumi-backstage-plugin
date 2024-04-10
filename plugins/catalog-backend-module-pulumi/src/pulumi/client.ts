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
    return await response.json() as Stacks;
}

export async function getStack(config: PulumiProviderConfig, logger: Logger, orgName: string, projectName: string, stackName: string): Promise<StackDetail> {
    const stackUrl = `${config.api}/api/stacks/${orgName}/${projectName}/${stackName}`;
    const response = await fetchFromPulumi(stackUrl, config, logger);
    return await response.json() as StackDetail;
}

import {readTaskScheduleDefinitionFromConfig} from '@backstage/backend-tasks';
import {Config} from '@backstage/config';
import {PulumiProviderConfig} from '../pulumi';

function readPulumiConfig(id: string, config: Config): PulumiProviderConfig {
    const api = config.getString('api');
    const organization = config.getString('organization')
    const pulumiAccessToken = config.getString('pulumiAccessToken')

    const schedule = config.has('schedule')
        ? readTaskScheduleDefinitionFromConfig(config.getConfig('schedule'))
        : undefined;

    return {
        api,
        organization,
        pulumiAccessToken,
        id,
        schedule,
    };
}

export function readPulumiConfigs(config: Config): PulumiProviderConfig[] {
    const configs: PulumiProviderConfig[] = [];

    const providerConfigs = config.getOptionalConfig('catalog.providers.pulumi');

    if (!providerConfigs) {
        return configs;
    }

    for (const id of providerConfigs.keys()) {
        configs.push(readPulumiConfig(id, providerConfigs.getConfig(id)));
    }

    return configs;
}

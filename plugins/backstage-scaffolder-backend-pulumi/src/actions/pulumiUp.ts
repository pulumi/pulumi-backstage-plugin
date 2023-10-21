import {createTemplateAction, executeShellCommand} from "@backstage/plugin-scaffolder-node";
import {RemoteWorkspace, fullyQualifiedStackName, LocalWorkspace} from "@pulumi/pulumi/automation";
import {InputError} from '@backstage/errors';
import commonPulumiConfig from "../commonPulumiConfig";
import {z} from "zod";

export function pulumiUpAction() {
    return createTemplateAction<{
        stack: string;
        organization: string;
        name: string;
        deployment: boolean
        repoUrl: string
        repoBranch: string
        repoProjectPath: string
        config: object;
        providerCredentialsFromEnv: string[];
        secretConfig: object;
        outputs: string[];
        preRunCommands: string[];
    }>({
            id: 'pulumi:up',
            description: 'Runs Pulumi',
            schema: {
                input: commonPulumiConfig.merge(
                    z.object({
                        deployment: z.boolean({description: 'This flag indicates that Pulumi Deployment will be used'}),
                        config: z.record(z.union([z.string(), z.number(), z.any()]), {description: 'The Pulumi project config to use'}).optional(),
                        secretConfig: z.record(z.union([z.string(), z.number(), z.any()]), {description: 'The Pulumi project secret config to use'}).optional(),
                        outputs: z.array(z.string(), {description: 'The Pulumi project outputs to return'}).optional(),
                        repoUrl: z.string({description: 'The Pulumi project repo URL to use, when using Pulumi Deployment'}).optional(),
                        repoBranch: z.string({description: 'The Pulumi project repo branch to use, when using Pulumi Deployment'}).optional(),
                        repoProjectPath: z.string({description: 'The Pulumi project repo path to use, when using Pulumi Deployment'}).optional(),
                        providerCredentialsFromEnv: z.array(z.string(), {description: 'The Pulumi project provider credentials to use'}).optional(),
                        preRunCommands: z.array(z.string(), {description: 'The Pulumi project pre-run commands to execute'}).optional(),
                    })
                ),
                output: z.record(z.union([z.string(), z.number(), z.any()]), {description: 'The Pulumi project outputs to return'}),
            },
            async handler(ctx) {
                ctx.logger.info('Running pulumi up...');
                ctx.logger.info(`Working directory: ${ctx.workspacePath}`);

                if (!ctx.input.deployment) {
                    const stackName = fullyQualifiedStackName(ctx.input.organization, ctx.input.name, ctx.input.stack);

                    // run the pre-run commands
                    if (ctx.input.preRunCommands) {
                        for (const command of ctx.input.preRunCommands) {
                            ctx.logger.info(`Running pre-run command: ${command}`)
                            var commandParts = command.split(' ');
                            await executeShellCommand({
                                command: commandParts[0],
                                args: commandParts.slice(1),
                                options: {
                                    cwd: ctx.workspacePath,
                                },
                                logStream: ctx.logStream,
                            })
                        }
                    }

                    const s = await LocalWorkspace.createOrSelectStack({
                        stackName: stackName,
                        workDir: `${ctx.workspacePath}/${ctx.input.repoProjectPath}`,
                    })

                    ctx.logger.info(`Successfully initialized stack ${s.name}`)
                    ctx.logger.info(`Refreshing stack ${s.name}...`)
                    await s.refresh({onOutput: ctx.logger.info})
                    ctx.logger.info(`Successfully refreshed stack ${s.name}`)

                    ctx.logger.info(`Updating stack ${s.name}...`)
                    const up = await s.up({onOutput: ctx.logger.info, showSecrets: true})
                    ctx.logger.info(`update summary: ${JSON.stringify(up.summary.resourceChanges, null, 4)}`)
                    for (const output of ctx.input.outputs) {
                        ctx.output(output, up.outputs[output].value)
                    }

                } else {
                    if (!ctx.input.repoUrl) {
                        throw new InputError('No Pulumi project repo URL specified, please specify a repo URL');
                    }
                    ctx.logger.info(`repoUrl: ${ctx.input.repoUrl}`)
                    if (!ctx.input.repoProjectPath) {
                        throw new InputError('No Pulumi project repo project path specified, please specify a repo project path');
                    }
                    ctx.logger.info(`repoProjectPath: ${ctx.input.repoProjectPath}`)
                    if (!ctx.input.repoBranch) {
                        throw new InputError('No Pulumi project repo branch specified, please specify a repo branch');
                    }
                    ctx.logger.info(`repoBranch: ${ctx.input.repoBranch}`)
                    const stackName = fullyQualifiedStackName(ctx.input.organization, ctx.input.name, ctx.input.stack);

                    // If we are using Pulumi Deployment, we need to set the provider credentials from the environment variables
                    // and pas them as envVars to the RemoteWorkspace.createOrSelectStack method
                    const configCredentialsObject: { [k: string]: any } = {};
                    if (ctx.input.providerCredentialsFromEnv !== null) {
                        for (const providerCredentialEnvName of ctx.input.providerCredentialsFromEnv) {
                            configCredentialsObject[providerCredentialEnvName] = {
                                secret: process.env[providerCredentialEnvName]
                            }
                        }
                    }
                    const remoteStack = await RemoteWorkspace.createOrSelectStack({
                        stackName: stackName,
                        url: ctx.input.repoUrl,
                        branch: `refs/heads/${ctx.input.repoBranch}`,
                        projectPath: ctx.input.repoProjectPath,
                    }, {
                        envVars: configCredentialsObject,
                    })
                    ctx.logger.info(`Successfully initialized stack ${remoteStack.name}`)
                    ctx.logger.info(`Refreshing stack ${remoteStack.name}...`)
                    await remoteStack.refresh({onOutput: ctx.logger.info})
                    ctx.logger.info(`Successfully refreshed stack ${remoteStack.name}`)

                    ctx.logger.info(`Updating stack ${remoteStack.name}...`)
                    const up = await remoteStack.up({onOutput: ctx.logger.info})
                    ctx.logger.info(`update summary: ${JSON.stringify(up.summary.resourceChanges, null, 4)}`)
                }
            }
        }
    )
}

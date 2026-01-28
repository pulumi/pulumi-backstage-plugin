import {createTemplateAction, executeShellCommand} from "@backstage/plugin-scaffolder-node";
import {fullyQualifiedStackName, LocalWorkspace, RemoteWorkspace} from "@pulumi/pulumi/automation";
import {InputError} from '@backstage/errors';

export function pulumiUpAction() {
    return createTemplateAction({
        id: 'pulumi:up',
        description: 'Runs Pulumi up to deploy infrastructure',
        schema: {
            input: {
                stack: z => z.string().describe('The Pulumi stack to use'),
                organization: z => z.string().describe('The Pulumi organization to use for the Pulumi commands'),
                name: z => z.string().describe('The Pulumi project name to use'),
                deployment: z => z.boolean().describe('This flag indicates that Pulumi Deployment will be used'),
                config: z => z.record(z.union([z.string(), z.number(), z.any()])).optional().describe('The Pulumi project config to use'),
                secretConfig: z => z.record(z.union([z.string(), z.number(), z.any()])).optional().describe('The Pulumi project secret config to use'),
                outputs: z => z.array(z.string()).optional().describe('The Pulumi project outputs to return'),
                repoUrl: z => z.string().optional().describe('The Pulumi project repo URL to use, when using Pulumi Deployment'),
                repoBranch: z => z.string().optional().describe('The Pulumi project repo branch to use, when using Pulumi Deployment'),
                repoProjectPath: z => z.string().optional().describe('The Pulumi project repo path to use, when using Pulumi Deployment'),
                providerCredentialsFromEnv: z => z.array(z.string()).optional().describe('The Pulumi project provider credentials to use'),
                preRunCommands: z => z.array(z.string()).optional().describe('The Pulumi project pre-run commands to execute'),
                suppressProgress: z => z.boolean().default(true).optional().describe('Suppress progress output'),
                showSecrets: z => z.boolean().default(false).optional().describe('Show secret values in outputs (default: false)'),
                environments: z => z.array(z.string()).optional().describe('ESC environments to add to the stack'),
            },
            output: {
                outputs: z => z.record(z.union([z.string(), z.number(), z.any()])).describe('The Pulumi project outputs to return'),
            },
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
                        const commandParts = command.split(' ');
                        await executeShellCommand({
                            command: commandParts[0],
                            args: commandParts.slice(1),
                            options: {
                                cwd: ctx.workspacePath,
                            },
                            logger: ctx.logger,
                        })
                    }
                }

                const s = await LocalWorkspace.createOrSelectStack({
                    stackName: stackName,
                    workDir: `${ctx.workspacePath}/${ctx.input.repoProjectPath}`,
                })

                ctx.logger.info(`Successfully initialized stack ${s.name}`)

                // Add ESC environments if specified
                if (ctx.input.environments && ctx.input.environments.length > 0) {
                    ctx.logger.info(`Adding ESC environments: ${ctx.input.environments.join(', ')}`);
                    await s.addEnvironments(...ctx.input.environments);
                }

                ctx.logger.info(`Refreshing stack ${s.name}...`)
                await s.refresh({onOutput: ctx.logger.info, suppressProgress: ctx.input.suppressProgress})
                ctx.logger.info(`Successfully refreshed stack ${s.name}`)

                ctx.logger.info(`Updating stack ${s.name}...`)
                const showSecrets = ctx.input.showSecrets ?? false;
                const up = await s.up({onOutput: ctx.logger.info, showSecrets, suppressProgress: ctx.input.suppressProgress})
                ctx.logger.info(`update summary: ${JSON.stringify(up.summary.resourceChanges, null, 4)}`)
                if (ctx.input.outputs) {
                    const outputResults: Record<string, any> = {};
                    for (const output of ctx.input.outputs) {
                        // Safe output handling: check if output exists before accessing value
                        if (up.outputs[output] !== undefined) {
                            outputResults[output] = up.outputs[output].value;
                        } else {
                            ctx.logger.warn(`Output '${output}' was requested but not found in stack outputs`);
                        }
                    }
                    ctx.output('outputs', outputResults);
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
                // and pass them as envVars to the RemoteWorkspace.createOrSelectStack method
                const configCredentialsObject: { [k: string]: any } = {};
                if (ctx.input.providerCredentialsFromEnv) {
                    for (const providerCredentialEnvName of ctx.input.providerCredentialsFromEnv) {
                        const envValue = process.env[providerCredentialEnvName];
                        if (envValue === undefined) {
                            ctx.logger.warn(`Environment variable '${providerCredentialEnvName}' is not set`);
                        }
                        configCredentialsObject[providerCredentialEnvName] = {
                            secret: envValue
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
                await remoteStack.refresh({onOutput: ctx.logger.info,})
                ctx.logger.info(`Successfully refreshed stack ${remoteStack.name}`)

                ctx.logger.info(`Updating stack ${remoteStack.name}...`)
                const up = await remoteStack.up({onOutput: ctx.logger.info})
                ctx.logger.info(`update summary: ${JSON.stringify(up.summary.resourceChanges, null, 4)}`)

                // Handle outputs for RemoteWorkspace as well
                if (ctx.input.outputs) {
                    const outputResults: Record<string, any> = {};
                    for (const output of ctx.input.outputs) {
                        if (up.outputs[output] !== undefined) {
                            outputResults[output] = up.outputs[output].value;
                        } else {
                            ctx.logger.warn(`Output '${output}' was requested but not found in stack outputs`);
                        }
                    }
                    ctx.output('outputs', outputResults);
                }
            }
        }
    })
}

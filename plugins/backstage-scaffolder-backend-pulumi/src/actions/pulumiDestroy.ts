import {createTemplateAction, executeShellCommand} from "@backstage/plugin-scaffolder-node";
import {fullyQualifiedStackName, LocalWorkspace} from "@pulumi/pulumi/automation";
import {InputError} from '@backstage/errors';

export function pulumiDestroyAction() {
    return createTemplateAction({
        id: 'pulumi:destroy',
        description: 'Destroys Pulumi stack resources (requires explicit confirmation)',
        schema: {
            input: {
                stack: z => z.string().describe('The Pulumi stack to use'),
                organization: z => z.string().describe('The Pulumi organization to use for the Pulumi commands'),
                name: z => z.string().describe('The Pulumi project name to use'),
                confirm: z => z.boolean().describe('Safety flag - must be set to true to execute destroy'),
                repoProjectPath: z => z.string().optional().describe('The Pulumi project repo path to use'),
                preRunCommands: z => z.array(z.string()).optional().describe('The Pulumi project pre-run commands to execute'),
                suppressProgress: z => z.boolean().default(true).optional().describe('Suppress progress output'),
                environments: z => z.array(z.string()).optional().describe('ESC environments to add to the stack'),
                removeStack: z => z.boolean().default(false).optional().describe('Remove the stack after destroying resources'),
                targetUrns: z => z.array(z.string()).optional().describe('Specific resource URNs to destroy'),
            },
            output: {
                summary: z => z.record(z.number()).describe('Summary of destroyed resources by operation type'),
            },
        },
        async handler(ctx) {
            ctx.logger.info('Running pulumi destroy...');
            ctx.logger.info(`Working directory: ${ctx.workspacePath}`);

            // Safety check - require explicit confirmation
            if (ctx.input.confirm !== true) {
                throw new InputError(
                    'Destroy operation requires explicit confirmation. Set confirm: true to proceed with destroying resources.'
                );
            }

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

            const workDir = ctx.input.repoProjectPath
                ? `${ctx.workspacePath}/${ctx.input.repoProjectPath}`
                : ctx.workspacePath;

            const s = await LocalWorkspace.createOrSelectStack({
                stackName: stackName,
                workDir: workDir,
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

            ctx.logger.info(`Destroying stack ${s.name}...`)
            const destroyOptions: any = {
                onOutput: ctx.logger.info,
                suppressProgress: ctx.input.suppressProgress,
            };

            // Add target URNs if specified
            if (ctx.input.targetUrns && ctx.input.targetUrns.length > 0) {
                destroyOptions.targetUrns = ctx.input.targetUrns;
            }

            const destroy = await s.destroy(destroyOptions)
            ctx.logger.info(`destroy summary: ${JSON.stringify(destroy.summary.resourceChanges, null, 4)}`)

            // Optionally remove the stack after destroying
            if (ctx.input.removeStack) {
                ctx.logger.info(`Removing stack ${s.name}...`)
                await s.workspace.removeStack(ctx.input.stack);
                ctx.logger.info(`Successfully removed stack ${s.name}`)
            }

            ctx.output('summary', destroy.summary.resourceChanges || {});
        }
    })
}

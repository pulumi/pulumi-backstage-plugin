import {createTemplateAction, executeShellCommand} from "@backstage/plugin-scaffolder-node";
import {fullyQualifiedStackName, LocalWorkspace} from "@pulumi/pulumi/automation";

export function pulumiPreviewAction() {
    return createTemplateAction({
        id: 'pulumi:preview',
        description: 'Previews Pulumi stack changes without deploying',
        schema: {
            input: {
                stack: z => z.string().describe('The Pulumi stack to use'),
                organization: z => z.string().describe('The Pulumi organization to use for the Pulumi commands'),
                name: z => z.string().describe('The Pulumi project name to use'),
                config: z => z.record(z.union([z.string(), z.number(), z.any()])).optional().describe('The Pulumi project config to use'),
                secretConfig: z => z.record(z.union([z.string(), z.number(), z.any()])).optional().describe('The Pulumi project secret config to use'),
                repoProjectPath: z => z.string().optional().describe('The Pulumi project repo path to use'),
                preRunCommands: z => z.array(z.string()).optional().describe('The Pulumi project pre-run commands to execute'),
                suppressProgress: z => z.boolean().default(true).optional().describe('Suppress progress output'),
                environments: z => z.array(z.string()).optional().describe('ESC environments to add to the stack'),
                expectNoChanges: z => z.boolean().default(false).optional().describe('Return an error if any changes are proposed'),
                refresh: z => z.boolean().default(true).optional().describe('Refresh the stack state before preview'),
            },
            output: {
                changeSummary: z => z.record(z.number()).describe('Summary of proposed changes by operation type'),
            },
        },
        async handler(ctx) {
            ctx.logger.info('Running pulumi preview...');
            ctx.logger.info(`Working directory: ${ctx.workspacePath}`);

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

            // Optionally refresh the stack state
            if (ctx.input.refresh !== false) {
                ctx.logger.info(`Refreshing stack ${s.name}...`)
                await s.refresh({onOutput: ctx.logger.info, suppressProgress: ctx.input.suppressProgress})
                ctx.logger.info(`Successfully refreshed stack ${s.name}`)
            }

            ctx.logger.info(`Previewing stack ${s.name}...`)
            const preview = await s.preview({
                onOutput: ctx.logger.info,
                expectNoChanges: ctx.input.expectNoChanges ?? false,
                suppressProgress: ctx.input.suppressProgress,
            })

            ctx.logger.info(`preview summary: ${JSON.stringify(preview.changeSummary, null, 4)}`)
            ctx.output('changeSummary', preview.changeSummary);
        }
    })
}

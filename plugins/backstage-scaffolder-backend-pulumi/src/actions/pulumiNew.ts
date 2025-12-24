import {
    createTemplateAction,
    executeShellCommand,
} from "@backstage/plugin-scaffolder-node";

export function pulumiNewAction() {
    return createTemplateAction({
        id: 'pulumi:new',
        description: 'Creates a new Pulumi project',
        schema: {
            input: {
                template: z => z.string().describe('The Pulumi template to use, this can be a built-in template or a URL to a template'),
                stack: z => z.string().describe('The Pulumi stack to use'),
                organization: z => z.string().describe('The Pulumi organization to use for the Pulumi commands'),
                name: z => z.string().describe('The Pulumi project name to use'),
                description: z => z.string().optional().describe('The Pulumi project description to use'),
                config: z => z.record(z.union([z.string(), z.number()])).optional().describe('The Pulumi project config to use'),
                secretConfig: z => z.record(z.union([z.string(), z.number()])).optional().describe('The Pulumi project secret config to use'),
                args: z => z.array(z.string()).optional().describe('The Pulumi command arguments to run'),
                folder: z => z.string().describe('The folder to run Pulumi in'),
            },
        },
        async handler(ctx) {
            ctx.logger.info('Executing pulumi:new action');
            ctx.logger.info(`Working directory: ${ctx.workspacePath}`);

            const stackName = `${ctx.input.organization}/${ctx.input.stack}`;
            ctx.logger.info(`Creating stack ${stackName}...`)

            const args = ['new', ctx.input.template, '--yes', '--force', '-n', ctx.input.name, '-s', stackName, '--dir', ctx.input.folder];

            if (ctx.input.description) {
                args.push('-d', ctx.input.description);
            }

            if (ctx.input.args) {
                const additionalArgs = ctx.input.args.flatMap((x: string) => x ? [x] : []);
                args.push(...additionalArgs);
            }

            const argsString = args.map(x => `${x}`).join(' ');

            ctx.logger.info(
                `Running "pulumi ${argsString}" in ${ctx.workspacePath}`,
            );

            await executeShellCommand({
                command: 'pulumi',
                args: args,
                options: {
                    cwd: ctx.workspacePath,
                },
                logger: ctx.logger,
            });
            if (ctx.input.config) {
                for (const [key, value] of Object.entries(ctx.input.config)) {
                    if (value !== null) {
                        await executeShellCommand({
                            command: 'pulumi',
                            args: ['config', 'set', key, String(value), '--stack', stackName, '--plaintext', '--non-interactive', '--cwd', ctx.input.folder],
                            options: {
                                cwd: ctx.workspacePath,
                            },
                            logger: ctx.logger,
                        });
                    }
                }
            }
            if (ctx.input.secretConfig) {
                for (const [key, value] of Object.entries(ctx.input.secretConfig)) {
                    if (value !== null) {
                        await executeShellCommand({
                            command: 'pulumi',
                            args: ['config', 'set', key, String(value), '--stack', stackName, '--secret', '--non-interactive', '--cwd', ctx.input.folder],
                            options: {
                                cwd: ctx.workspacePath,
                            },
                            logger: ctx.logger,
                        });
                    }
                }
            }
        }
    })
}

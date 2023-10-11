import {
    createTemplateAction,
    executeShellCommand,
} from "@backstage/plugin-scaffolder-node";

import commonPulumiConfig from "../commonPulumiConfig";
import {z} from "zod";

export function pulumiNewAction() {
    return createTemplateAction<{
        template: string;
        stack: string;
        organization: string;
        name: string;
        description: string;
        config: object;
        secretConfig: object;
        args: string[];
        folder: string;
    }>({
            id: 'pulumi:new',
            description: 'Creates a new Pulumi project',
            schema: {
                input: commonPulumiConfig.merge(
                    z.object({
                        template: z.string({description: 'The Pulumi template to use, this can be a built-in template or a URL to a template'}),
                        description: z.string({description: 'The Pulumi project description to use'}).optional(),
                        config: z.record(z.union([z.string(), z.number()]), {description: 'The Pulumi project config to use'}).optional(),
                        secretConfig: z.record(z.union([z.string(), z.number()]), {description: 'The Pulumi project secret config to use'}).optional(),
                        args: z.array(z.string(), {description: 'The Pulumi command arguments to run'}).optional(),
                        folder: z.string({description: 'The folder to run Pulumi in'}),
                    }),
                ),
            },
            async handler(ctx) {
                ctx.logger.info('Executing pulumi:new action');
                ctx.logger.info(`Working directory: ${ctx.workspacePath}`);

                const stackName = `${ctx.input.organization}/${ctx.input.stack}`;
                ctx.logger.info(`Creating stack ${stackName}...`)

                const args = ['new', ctx.input.template, '--yes', '--force', '-n', ctx.input.name, '-s', stackName, '--dir', ctx.input.folder];

                if (ctx.input.description !== null) {
                    args.push('-d', ctx.input.description);
                }

                if (ctx.input.args) {
                    const additionalArgs = ctx.input.args.flatMap(x => x ? [x] : []);
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
                    logStream: ctx.logStream,
                });
                if (ctx.input.config) {
                    for (const [key, value] of Object.entries(ctx.input.config)) {
                        if (value !== null) {
                            await executeShellCommand({
                                command: 'pulumi',
                                args: ['config', 'set', key, value, '--stack', stackName, '--plaintext', '--non-interactive', '--cwd', ctx.input.folder],
                                options: {
                                    cwd: ctx.workspacePath,
                                },
                                logStream: ctx.logStream,
                            });
                        }
                    }
                }
                if (ctx.input.secretConfig) {
                    for (const [key, value] of Object.entries(ctx.input.secretConfig)) {
                        if (value !== null) {
                            await executeShellCommand({
                                command: 'pulumi',
                                args: ['config', 'set', key, value, '--stack', stackName, '--secret', '--non-interactive', '--cwd', ctx.input.folder],
                                options: {
                                    cwd: ctx.workspacePath,
                                },
                                logStream: ctx.logStream,
                            });
                        }
                    }
                }
            }
        }
    )
}

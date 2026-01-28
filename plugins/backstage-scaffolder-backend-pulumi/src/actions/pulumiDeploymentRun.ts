import {createTemplateAction} from "@backstage/plugin-scaffolder-node";
import {InputError} from '@backstage/errors';

export function pulumiDeploymentRunAction() {
    return createTemplateAction({
        id: 'pulumi:deployment:run',
        description: 'Triggers a Pulumi Deployment via the Pulumi Cloud REST API',
        schema: {
            input: {
                organization: z => z.string().describe('The Pulumi organization'),
                project: z => z.string().describe('The Pulumi project name'),
                stack: z => z.string().describe('The Pulumi stack name'),
                operation: z => z.enum(['update', 'preview', 'refresh', 'destroy', 'detect-drift']).describe('The deployment operation to run'),
                inheritSettings: z => z.boolean().default(true).optional().describe('Inherit deployment settings from stack configuration'),
                pulumiAccessToken: z => z.string().optional().describe('Pulumi access token (defaults to PULUMI_ACCESS_TOKEN env var)'),
                apiUrl: z => z.string().default('https://api.pulumi.com').optional().describe('Pulumi API URL'),
                operationContext: z => z.object({
                    environmentVariables: z.record(z.object({
                        secret: z.boolean().optional(),
                        value: z.string(),
                    })).optional(),
                    options: z.object({
                        skipInstallDependencies: z.boolean().optional(),
                        skipIntermediateDeployments: z.boolean().optional(),
                    }).optional(),
                }).optional().describe('Override operation context settings'),
                sourceContext: z => z.object({
                    git: z.object({
                        repoUrl: z.string().optional(),
                        branch: z.string().optional(),
                        repoDir: z.string().optional(),
                        commit: z.string().optional(),
                        gitAuth: z.object({
                            sshAuth: z.object({
                                sshPrivateKey: z.string(),
                                password: z.string().optional(),
                            }).optional(),
                            basicAuth: z.object({
                                username: z.string(),
                                password: z.string(),
                            }).optional(),
                        }).optional(),
                    }).optional(),
                }).optional().describe('Override source context settings'),
            },
            output: {
                deploymentId: z => z.string().describe('The ID of the triggered deployment'),
                deploymentUrl: z => z.string().describe('URL to view the deployment in Pulumi Cloud'),
                version: z => z.number().describe('The deployment version number'),
            },
        },
        async handler(ctx) {
            ctx.logger.info('Triggering Pulumi Deployment...');

            const accessToken = ctx.input.pulumiAccessToken || process.env.PULUMI_ACCESS_TOKEN;
            if (!accessToken) {
                throw new InputError(
                    'Pulumi access token is required. Provide pulumiAccessToken input or set PULUMI_ACCESS_TOKEN environment variable.'
                );
            }

            const apiUrl = ctx.input.apiUrl || 'https://api.pulumi.com';
            const endpoint = `${apiUrl}/api/stacks/${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}/deployments`;

            ctx.logger.info(`Triggering ${ctx.input.operation} deployment for stack ${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}`);

            const requestBody: any = {
                operation: ctx.input.operation,
                inheritSettings: ctx.input.inheritSettings ?? true,
            };

            // Add optional overrides
            if (ctx.input.operationContext) {
                requestBody.operationContext = ctx.input.operationContext;
            }
            if (ctx.input.sourceContext) {
                requestBody.sourceContext = ctx.input.sourceContext;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.pulumi+8',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new InputError(
                    `Failed to trigger Pulumi Deployment: ${response.status} ${response.statusText} - ${errorText}`
                );
            }

            const result = await response.json() as { id: string; version: number };

            const deploymentUrl = `https://app.pulumi.com/${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}/deployments/${result.version}`;

            ctx.logger.info(`Successfully triggered deployment ${result.id}`);
            ctx.logger.info(`Deployment URL: ${deploymentUrl}`);

            ctx.output('deploymentId', result.id);
            ctx.output('deploymentUrl', deploymentUrl);
            ctx.output('version', result.version);
        }
    })
}

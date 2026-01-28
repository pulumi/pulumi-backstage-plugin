import {createTemplateAction} from "@backstage/plugin-scaffolder-node";
import {InputError} from '@backstage/errors';

export function pulumiDeploymentConfigAction() {
    return createTemplateAction({
        id: 'pulumi:deployment:config',
        description: 'Creates or configures Pulumi Deployment settings via the Pulumi Cloud REST API',
        schema: {
            input: {
                organization: z => z.string().describe('The Pulumi organization'),
                project: z => z.string().describe('The Pulumi project name'),
                stack: z => z.string().describe('The Pulumi stack name'),
                pulumiAccessToken: z => z.string().optional().describe('Pulumi access token (defaults to PULUMI_ACCESS_TOKEN env var)'),
                apiUrl: z => z.string().default('https://api.pulumi.com').optional().describe('Pulumi API URL'),
                sourceContext: z => z.object({
                    git: z.object({
                        repoUrl: z.string().describe('Repository URL'),
                        branch: z.string().optional().describe('Branch to deploy from'),
                        repoDir: z.string().optional().describe('Directory within the repository'),
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
                    }),
                }).optional().describe('Git source configuration'),
                operationContext: z => z.object({
                    preRunCommands: z.array(z.string()).optional().describe('Commands to run before deployment'),
                    environmentVariables: z.record(z.object({
                        secret: z.boolean().optional(),
                        value: z.string(),
                    })).optional().describe('Environment variables for deployment'),
                    options: z.object({
                        skipInstallDependencies: z.boolean().optional(),
                        skipIntermediateDeployments: z.boolean().optional(),
                        shellName: z.string().optional(),
                        deleteAfterDestroy: z.boolean().optional(),
                        remediateIfDriftDetected: z.boolean().optional(),
                    }).optional().describe('Deployment options'),
                    oidc: z.object({
                        aws: z.object({
                            roleArn: z.string(),
                            sessionName: z.string().optional(),
                            policyArns: z.array(z.string()).optional(),
                            duration: z.string().optional(),
                        }).optional(),
                        gcp: z.object({
                            projectId: z.string(),
                            region: z.string().optional(),
                            workloadPoolId: z.string(),
                            providerId: z.string(),
                            serviceAccount: z.string(),
                            tokenLifetime: z.string().optional(),
                        }).optional(),
                        azure: z.object({
                            clientId: z.string(),
                            tenantId: z.string(),
                            subscriptionId: z.string(),
                        }).optional(),
                    }).optional().describe('OIDC configuration for cloud provider authentication'),
                }).optional().describe('Operation context configuration'),
                github: z => z.object({
                    repository: z.string().describe('GitHub repository in owner/repo format'),
                    deployCommits: z.boolean().default(true).optional().describe('Deploy on commit to branch'),
                    previewPullRequests: z.boolean().default(true).optional().describe('Preview pull requests'),
                    pullRequestTemplate: z.boolean().default(false).optional().describe('Use PR template for previews'),
                    paths: z.array(z.string()).optional().describe('Paths to trigger deployments'),
                }).optional().describe('GitHub integration settings'),
                cacheOptions: z => z.object({
                    enable: z.boolean().default(true).describe('Enable dependency caching'),
                }).optional().describe('Cache options for deployments'),
                executorContext: z => z.object({
                    executorImage: z.string().optional().describe('Custom executor image'),
                }).optional().describe('Executor context configuration'),
            },
            output: {
                settingsUrl: z => z.string().describe('URL to view deployment settings in Pulumi Cloud'),
                configured: z => z.boolean().describe('Whether settings were successfully configured'),
            },
        },
        async handler(ctx) {
            ctx.logger.info('Configuring Pulumi Deployment settings...');

            const accessToken = ctx.input.pulumiAccessToken || process.env.PULUMI_ACCESS_TOKEN;
            if (!accessToken) {
                throw new InputError(
                    'Pulumi access token is required. Provide pulumiAccessToken input or set PULUMI_ACCESS_TOKEN environment variable.'
                );
            }

            const apiUrl = ctx.input.apiUrl || 'https://api.pulumi.com';
            const endpoint = `${apiUrl}/api/stacks/${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}/deployments/settings`;

            ctx.logger.info(`Configuring deployment settings for stack ${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}`);

            const requestBody: any = {};

            // Add source context if specified
            if (ctx.input.sourceContext) {
                requestBody.sourceContext = ctx.input.sourceContext;
            }

            // Add operation context if specified
            if (ctx.input.operationContext) {
                requestBody.operationContext = ctx.input.operationContext;
            }

            // Add GitHub integration if specified
            if (ctx.input.github) {
                requestBody.gitHub = {
                    repository: ctx.input.github.repository,
                    deployCommits: ctx.input.github.deployCommits ?? true,
                    previewPullRequests: ctx.input.github.previewPullRequests ?? true,
                    pullRequestTemplate: ctx.input.github.pullRequestTemplate ?? false,
                    paths: ctx.input.github.paths,
                };
            }

            // Add cache options if specified
            if (ctx.input.cacheOptions) {
                requestBody.cacheOptions = ctx.input.cacheOptions;
            }

            // Add executor context if specified
            if (ctx.input.executorContext) {
                requestBody.executorContext = ctx.input.executorContext;
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
                    `Failed to configure Pulumi Deployment settings: ${response.status} ${response.statusText} - ${errorText}`
                );
            }

            const settingsUrl = `https://app.pulumi.com/${ctx.input.organization}/${ctx.input.project}/${ctx.input.stack}/settings/deploy`;

            ctx.logger.info(`Successfully configured deployment settings`);
            ctx.logger.info(`Settings URL: ${settingsUrl}`);

            ctx.output('settingsUrl', settingsUrl);
            ctx.output('configured', true);
        }
    })
}

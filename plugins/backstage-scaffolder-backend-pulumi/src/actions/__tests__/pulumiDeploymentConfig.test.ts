import { pulumiDeploymentConfigAction } from '../pulumiDeploymentConfig';
import { createMockActionContext, createMockFetchResponse } from './testUtils';

// Mock the scaffolder-node module
jest.mock('@backstage/plugin-scaffolder-node', () => ({
    createTemplateAction: jest.fn((config) => config),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('pulumiDeploymentConfigAction', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, PULUMI_ACCESS_TOKEN: 'test-token' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiDeploymentConfigAction();

        expect(action.id).toBe('pulumi:deployment:config');
        expect(action.description).toBe('Creates or configures Pulumi Deployment settings via the Pulumi Cloud REST API');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
        expect(action.schema?.output).toBeDefined();
    });

    it('should call correct REST API endpoint for settings', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
            },
        });

        await action.handler(ctx as any);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.pulumi.com/api/stacks/my-org/my-project/dev/deployments/settings',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'token test-token',
                    'Content-Type': 'application/json',
                }),
            }),
        );
    });

    it('should handle sourceContext configuration', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                sourceContext: {
                    git: {
                        repoUrl: 'https://github.com/my-org/my-repo',
                        branch: 'main',
                        repoDir: 'infra',
                    },
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.sourceContext).toBeDefined();
        expect(callBody.sourceContext.git.repoUrl).toBe('https://github.com/my-org/my-repo');
        expect(callBody.sourceContext.git.branch).toBe('main');
    });

    it('should handle operationContext with OIDC', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operationContext: {
                    preRunCommands: ['npm install'],
                    oidc: {
                        aws: {
                            roleArn: 'arn:aws:iam::123456789012:role/PulumiRole',
                            sessionName: 'pulumi-deployment',
                        },
                    },
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.operationContext).toBeDefined();
        expect(callBody.operationContext.oidc.aws.roleArn).toBe('arn:aws:iam::123456789012:role/PulumiRole');
    });

    it('should handle GitHub integration settings', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                github: {
                    repository: 'my-org/my-repo',
                    deployCommits: true,
                    previewPullRequests: true,
                    paths: ['infra/**'],
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.gitHub).toBeDefined();
        expect(callBody.gitHub.repository).toBe('my-org/my-repo');
        expect(callBody.gitHub.deployCommits).toBe(true);
        expect(callBody.gitHub.previewPullRequests).toBe(true);
    });

    it('should handle cacheOptions', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                cacheOptions: {
                    enable: true,
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.cacheOptions).toBeDefined();
        expect(callBody.cacheOptions.enable).toBe(true);
    });

    it('should return success status and settingsUrl', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
            },
        });

        await action.handler(ctx as any);

        expect(ctx.output).toHaveBeenCalledWith('configured', true);
        expect(ctx.output).toHaveBeenCalledWith(
            'settingsUrl',
            'https://app.pulumi.com/my-org/my-project/dev/settings/deploy',
        );
    });

    it('should handle API errors', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                text: 'Insufficient permissions',
            }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Failed to configure Pulumi Deployment settings: 403 Forbidden',
        );
    });

    it('should throw error when access token is missing', async () => {
        delete process.env.PULUMI_ACCESS_TOKEN;

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Pulumi access token is required',
        );
    });

    it('should handle executorContext', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                executorContext: {
                    executorImage: 'pulumi/pulumi:latest',
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.executorContext).toBeDefined();
        expect(callBody.executorContext.executorImage).toBe('pulumi/pulumi:latest');
    });

    it('should default GitHub settings correctly', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({ ok: true }),
        );

        const action = pulumiDeploymentConfigAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                github: {
                    repository: 'my-org/my-repo',
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.gitHub.deployCommits).toBe(true);
        expect(callBody.gitHub.previewPullRequests).toBe(true);
        expect(callBody.gitHub.pullRequestTemplate).toBe(false);
    });
});

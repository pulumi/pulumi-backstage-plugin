import { pulumiDeploymentRunAction } from '../pulumiDeploymentRun';
import { createMockActionContext, createMockFetchResponse } from './testUtils';

// Mock the scaffolder-node module
jest.mock('@backstage/plugin-scaffolder-node', () => ({
    createTemplateAction: jest.fn((config) => config),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('pulumiDeploymentRunAction', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, PULUMI_ACCESS_TOKEN: 'test-token' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiDeploymentRunAction();

        expect(action.id).toBe('pulumi:deployment:run');
        expect(action.description).toBe('Triggers a Pulumi Deployment via the Pulumi Cloud REST API');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
        expect(action.schema?.output).toBeDefined();
    });

    it('should call correct REST API endpoint', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-123', version: 1 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
            },
        });

        await action.handler(ctx as any);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.pulumi.com/api/stacks/my-org/my-project/dev/deployments',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'token test-token',
                    'Content-Type': 'application/json',
                }),
            }),
        );
    });

    it('should handle all operation types', async () => {
        const operations = ['update', 'preview', 'refresh', 'destroy', 'detect-drift'] as const;

        for (const operation of operations) {
            mockFetch.mockResolvedValue(
                createMockFetchResponse({
                    ok: true,
                    json: { id: `deploy-${operation}`, version: 1 },
                }),
            );

            const action = pulumiDeploymentRunAction();
            const ctx = createMockActionContext({
                input: {
                    organization: 'my-org',
                    project: 'my-project',
                    stack: 'dev',
                    operation,
                },
            });

            await action.handler(ctx as any);

            expect(mockFetch).toHaveBeenLastCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: expect.stringContaining(`"operation":"${operation}"`),
                }),
            );
        }
    });

    it('should pass inheritSettings correctly', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-123', version: 1 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
                inheritSettings: false,
            },
        });

        await action.handler(ctx as any);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"inheritSettings":false'),
            }),
        );
    });

    it('should include optional overrides in request', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-123', version: 1 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
                operationContext: {
                    environmentVariables: {
                        MY_VAR: { value: 'test', secret: false },
                    },
                },
                sourceContext: {
                    git: {
                        repoUrl: 'https://github.com/my-org/my-repo',
                        branch: 'feature',
                    },
                },
            },
        });

        await action.handler(ctx as any);

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.operationContext).toBeDefined();
        expect(callBody.sourceContext).toBeDefined();
    });

    it('should return deploymentId and deploymentUrl', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-456', version: 5 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
            },
        });

        await action.handler(ctx as any);

        expect(ctx.output).toHaveBeenCalledWith('deploymentId', 'deploy-456');
        expect(ctx.output).toHaveBeenCalledWith('version', 5);
        expect(ctx.output).toHaveBeenCalledWith(
            'deploymentUrl',
            'https://app.pulumi.com/my-org/my-project/dev/deployments/5',
        );
    });

    it('should handle API errors gracefully', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: 'Stack not found',
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'nonexistent',
                operation: 'update',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Failed to trigger Pulumi Deployment: 404 Not Found',
        );
    });

    it('should throw error when access token is missing', async () => {
        delete process.env.PULUMI_ACCESS_TOKEN;

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Pulumi access token is required',
        );
    });

    it('should use custom API URL when provided', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-123', version: 1 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
                apiUrl: 'https://api.custom.pulumi.com',
            },
        });

        await action.handler(ctx as any);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.custom.pulumi.com/api/stacks/my-org/my-project/dev/deployments',
            expect.any(Object),
        );
    });

    it('should use provided pulumiAccessToken over env var', async () => {
        mockFetch.mockResolvedValue(
            createMockFetchResponse({
                ok: true,
                json: { id: 'deploy-123', version: 1 },
            }),
        );

        const action = pulumiDeploymentRunAction();
        const ctx = createMockActionContext({
            input: {
                organization: 'my-org',
                project: 'my-project',
                stack: 'dev',
                operation: 'update',
                pulumiAccessToken: 'custom-token',
            },
        });

        await action.handler(ctx as any);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'token custom-token',
                }),
            }),
        );
    });
});

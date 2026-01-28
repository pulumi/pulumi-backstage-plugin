import { pulumiUpAction } from '../pulumiUp';
import { createMockActionContext } from './testUtils';

// Create mock stack object
const mockStack = {
    name: 'org/project/stack',
    refresh: jest.fn().mockResolvedValue({}),
    up: jest.fn().mockResolvedValue({
        summary: { resourceChanges: { create: 1 } },
        outputs: {
            endpoint: { value: 'https://example.com' },
            instanceId: { value: 'i-12345' },
        },
    }),
    addEnvironments: jest.fn().mockResolvedValue(undefined),
};

// Mock the Pulumi automation API
jest.mock('@pulumi/pulumi/automation', () => ({
    fullyQualifiedStackName: jest.fn((org, project, stack) => `${org}/${project}/${stack}`),
    LocalWorkspace: {
        createOrSelectStack: jest.fn().mockImplementation(() => Promise.resolve(mockStack)),
    },
    RemoteWorkspace: {
        createOrSelectStack: jest.fn().mockImplementation(() => Promise.resolve(mockStack)),
    },
}));

// Mock the scaffolder-node module
jest.mock('@backstage/plugin-scaffolder-node', () => ({
    createTemplateAction: jest.fn((config) => config),
    executeShellCommand: jest.fn().mockResolvedValue(undefined),
}));

import { LocalWorkspace, RemoteWorkspace } from '@pulumi/pulumi/automation';
import { executeShellCommand } from '@backstage/plugin-scaffolder-node';

describe('pulumiUpAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock stack state
        mockStack.up.mockResolvedValue({
            summary: { resourceChanges: { create: 1 } },
            outputs: {
                endpoint: { value: 'https://example.com' },
                instanceId: { value: 'i-12345' },
            },
        });
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiUpAction();

        expect(action.id).toBe('pulumi:up');
        expect(action.description).toBe('Runs Pulumi up to deploy infrastructure');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
        expect(action.schema?.output).toBeDefined();
    });

    it('should use LocalWorkspace when deployment is false', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
            },
        });

        await action.handler(ctx as any);

        expect(LocalWorkspace.createOrSelectStack).toHaveBeenCalled();
        expect(RemoteWorkspace.createOrSelectStack).not.toHaveBeenCalled();
    });

    it('should use RemoteWorkspace when deployment is true', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: true,
                repoUrl: 'https://github.com/my-org/my-repo',
                repoBranch: 'main',
                repoProjectPath: '.',
            },
        });

        await action.handler(ctx as any);

        expect(RemoteWorkspace.createOrSelectStack).toHaveBeenCalled();
    });

    it('should handle ESC environments correctly', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
                environments: ['my-org/dev-env', 'my-org/aws-creds'],
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.addEnvironments).toHaveBeenCalledWith(
            'my-org/dev-env',
            'my-org/aws-creds',
        );
    });

    it('should handle outputs with existence check', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
                outputs: ['endpoint', 'nonExistent'],
            },
        });

        await action.handler(ctx as any);

        // Should output the existing value
        expect(ctx.output).toHaveBeenCalledWith('outputs', {
            endpoint: 'https://example.com',
        });

        // Should warn about missing output
        expect(ctx.logger.warn).toHaveBeenCalledWith(
            "Output 'nonExistent' was requested but not found in stack outputs",
        );
    });

    it('should respect showSecrets parameter (default false)', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.up).toHaveBeenCalledWith(
            expect.objectContaining({
                showSecrets: false,
            }),
        );
    });

    it('should allow showSecrets to be set to true', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
                showSecrets: true,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.up).toHaveBeenCalledWith(
            expect.objectContaining({
                showSecrets: true,
            }),
        );
    });

    it('should execute preRunCommands in order', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: false,
                repoProjectPath: '.',
                preRunCommands: ['npm install', 'npm run build'],
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledTimes(2);
        expect(executeShellCommand).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                command: 'npm',
                args: ['install'],
            }),
        );
        expect(executeShellCommand).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                command: 'npm',
                args: ['run', 'build'],
            }),
        );
    });

    it('should warn on missing environment variables', async () => {
        const originalEnv = process.env.MY_CUSTOM_VAR;
        delete process.env.MY_CUSTOM_VAR;

        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: true,
                repoUrl: 'https://github.com/my-org/my-repo',
                repoBranch: 'main',
                repoProjectPath: '.',
                providerCredentialsFromEnv: ['MY_CUSTOM_VAR'],
            },
        });

        await action.handler(ctx as any);

        expect(ctx.logger.warn).toHaveBeenCalledWith(
            "Environment variable 'MY_CUSTOM_VAR' is not set",
        );

        // Restore
        if (originalEnv !== undefined) {
            process.env.MY_CUSTOM_VAR = originalEnv;
        }
    });

    it('should throw error when deployment is true but repoUrl is missing', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: true,
                repoBranch: 'main',
                repoProjectPath: '.',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'No Pulumi project repo URL specified',
        );
    });

    it('should throw error when deployment is true but repoBranch is missing', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: true,
                repoUrl: 'https://github.com/my-org/my-repo',
                repoProjectPath: '.',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'No Pulumi project repo branch specified',
        );
    });

    it('should handle RemoteWorkspace outputs correctly', async () => {
        const action = pulumiUpAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                deployment: true,
                repoUrl: 'https://github.com/my-org/my-repo',
                repoBranch: 'main',
                repoProjectPath: '.',
                outputs: ['endpoint'],
            },
        });

        await action.handler(ctx as any);

        expect(ctx.output).toHaveBeenCalledWith('outputs', {
            endpoint: 'https://example.com',
        });
    });
});

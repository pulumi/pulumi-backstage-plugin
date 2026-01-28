import { pulumiDestroyAction } from '../pulumiDestroy';
import { createMockActionContext } from './testUtils';

// Create mock stack object
const mockStack = {
    name: 'org/project/stack',
    refresh: jest.fn().mockResolvedValue({}),
    destroy: jest.fn().mockResolvedValue({
        summary: { resourceChanges: { delete: 3 } },
    }),
    addEnvironments: jest.fn().mockResolvedValue(undefined),
    workspace: {
        removeStack: jest.fn().mockResolvedValue(undefined),
    },
};

// Mock the Pulumi automation API
jest.mock('@pulumi/pulumi/automation', () => ({
    fullyQualifiedStackName: jest.fn((org, project, stack) => `${org}/${project}/${stack}`),
    LocalWorkspace: {
        createOrSelectStack: jest.fn().mockImplementation(() => Promise.resolve(mockStack)),
    },
}));

// Mock the scaffolder-node module
jest.mock('@backstage/plugin-scaffolder-node', () => ({
    createTemplateAction: jest.fn((config) => config),
    executeShellCommand: jest.fn().mockResolvedValue(undefined),
}));

import { LocalWorkspace } from '@pulumi/pulumi/automation';
import { executeShellCommand } from '@backstage/plugin-scaffolder-node';

describe('pulumiDestroyAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStack.destroy.mockResolvedValue({
            summary: { resourceChanges: { delete: 3 } },
        });
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiDestroyAction();

        expect(action.id).toBe('pulumi:destroy');
        expect(action.description).toBe('Destroys Pulumi stack resources (requires explicit confirmation)');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
        expect(action.schema?.output).toBeDefined();
    });

    it('should throw error when confirm is not true', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: false,
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Destroy operation requires explicit confirmation',
        );
    });

    it('should throw error when confirm is not provided', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
            },
        });

        await expect(action.handler(ctx as any)).rejects.toThrow(
            'Destroy operation requires explicit confirmation',
        );
    });

    it('should call stack.destroy() when confirm is true', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
            },
        });

        await action.handler(ctx as any);

        expect(LocalWorkspace.createOrSelectStack).toHaveBeenCalled();
        expect(mockStack.destroy).toHaveBeenCalled();
    });

    it('should handle ESC environments', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
                environments: ['my-org/dev-env'],
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.addEnvironments).toHaveBeenCalledWith('my-org/dev-env');
    });

    it('should output destroy summary', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
            },
        });

        await action.handler(ctx as any);

        expect(ctx.output).toHaveBeenCalledWith('summary', { delete: 3 });
    });

    it('should remove stack when removeStack is true', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
                removeStack: true,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.workspace.removeStack).toHaveBeenCalledWith('dev');
    });

    it('should not remove stack when removeStack is false', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
                removeStack: false,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.workspace.removeStack).not.toHaveBeenCalled();
    });

    it('should handle targetUrns option', async () => {
        const action = pulumiDestroyAction();
        const targetUrns = [
            'urn:pulumi:dev::my-project::aws:s3/bucket:Bucket::my-bucket',
        ];
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
                targetUrns,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.destroy).toHaveBeenCalledWith(
            expect.objectContaining({
                targetUrns,
            }),
        );
    });

    it('should execute preRunCommands', async () => {
        const action = pulumiDestroyAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                confirm: true,
                preRunCommands: ['npm install'],
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: 'npm',
                args: ['install'],
            }),
        );
    });
});

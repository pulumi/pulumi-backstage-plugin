import { pulumiPreviewAction } from '../pulumiPreview';
import { createMockActionContext } from './testUtils';

// Create mock stack object
const mockStack = {
    name: 'org/project/stack',
    refresh: jest.fn().mockResolvedValue({}),
    preview: jest.fn().mockResolvedValue({
        changeSummary: { create: 2, update: 1 },
    }),
    addEnvironments: jest.fn().mockResolvedValue(undefined),
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

describe('pulumiPreviewAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStack.preview.mockResolvedValue({
            changeSummary: { create: 2, update: 1 },
        });
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiPreviewAction();

        expect(action.id).toBe('pulumi:preview');
        expect(action.description).toBe('Previews Pulumi stack changes without deploying');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
        expect(action.schema?.output).toBeDefined();
    });

    it('should call stack.preview() with correct options', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                repoProjectPath: '.',
            },
        });

        await action.handler(ctx as any);

        expect(LocalWorkspace.createOrSelectStack).toHaveBeenCalled();
        expect(mockStack.preview).toHaveBeenCalledWith(
            expect.objectContaining({
                expectNoChanges: false,
            }),
        );
    });

    it('should handle ESC environments', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                environments: ['my-org/dev-env'],
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.addEnvironments).toHaveBeenCalledWith('my-org/dev-env');
    });

    it('should return preview summary in output', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
            },
        });

        await action.handler(ctx as any);

        expect(ctx.output).toHaveBeenCalledWith('changeSummary', {
            create: 2,
            update: 1,
        });
    });

    it('should handle expectNoChanges option', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                expectNoChanges: true,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.preview).toHaveBeenCalledWith(
            expect.objectContaining({
                expectNoChanges: true,
            }),
        );
    });

    it('should skip refresh when refresh is false', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                refresh: false,
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.refresh).not.toHaveBeenCalled();
    });

    it('should refresh by default', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
            },
        });

        await action.handler(ctx as any);

        expect(mockStack.refresh).toHaveBeenCalled();
    });

    it('should execute preRunCommands', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
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

    it('should use workspacePath when repoProjectPath is not specified', async () => {
        const action = pulumiPreviewAction();
        const ctx = createMockActionContext({
            workspacePath: '/custom/workspace',
            input: {
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
            },
        });

        await action.handler(ctx as any);

        expect(LocalWorkspace.createOrSelectStack).toHaveBeenCalledWith(
            expect.objectContaining({
                workDir: '/custom/workspace',
            }),
        );
    });
});

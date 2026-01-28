import { pulumiNewAction } from '../pulumiNew';
import { createMockActionContext } from './testUtils';

// Mock the scaffolder-node module
jest.mock('@backstage/plugin-scaffolder-node', () => ({
    createTemplateAction: jest.fn((config) => config),
    executeShellCommand: jest.fn().mockResolvedValue(undefined),
}));

import { executeShellCommand } from '@backstage/plugin-scaffolder-node';

describe('pulumiNewAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create action with correct id and schema', () => {
        const action = pulumiNewAction();

        expect(action.id).toBe('pulumi:new');
        expect(action.description).toBe('Creates a new Pulumi project');
        expect(action.schema).toBeDefined();
        expect(action.schema?.input).toBeDefined();
    });

    it('should call pulumi new with correct arguments', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                folder: 'infra',
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: 'pulumi',
                args: expect.arrayContaining([
                    'new',
                    'typescript',
                    '--yes',
                    '--force',
                    '-n',
                    'my-project',
                    '-s',
                    'my-org/dev',
                    '--dir',
                    'infra',
                ]),
            }),
        );
    });

    it('should handle optional description', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                description: 'My awesome project',
                folder: '.',
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                args: expect.arrayContaining(['-d', 'My awesome project']),
            }),
        );
    });

    it('should handle config values correctly', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                folder: 'infra',
                config: {
                    'aws:region': 'us-west-2',
                    'myapp:count': 3,
                },
            },
        });

        await action.handler(ctx as any);

        // First call is for pulumi new
        expect(executeShellCommand).toHaveBeenCalledTimes(3);

        // Check config set calls
        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: 'pulumi',
                args: expect.arrayContaining([
                    'config',
                    'set',
                    'aws:region',
                    'us-west-2',
                    '--stack',
                    'my-org/dev',
                    '--plaintext',
                    '--non-interactive',
                    '--cwd',
                    'infra',
                ]),
            }),
        );
    });

    it('should handle secretConfig values correctly', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                folder: 'infra',
                secretConfig: {
                    'myapp:apiKey': 'secret-value',
                },
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                command: 'pulumi',
                args: expect.arrayContaining([
                    'config',
                    'set',
                    'myapp:apiKey',
                    'secret-value',
                    '--stack',
                    'my-org/dev',
                    '--secret',
                    '--non-interactive',
                    '--cwd',
                    'infra',
                ]),
            }),
        );
    });

    it('should handle additional args', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                folder: '.',
                args: ['--generate-only', '--offline'],
            },
        });

        await action.handler(ctx as any);

        expect(executeShellCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                args: expect.arrayContaining(['--generate-only', '--offline']),
            }),
        );
    });

    it('should skip null config values', async () => {
        const action = pulumiNewAction();
        const ctx = createMockActionContext({
            input: {
                template: 'typescript',
                stack: 'dev',
                organization: 'my-org',
                name: 'my-project',
                folder: 'infra',
                config: {
                    'aws:region': 'us-west-2',
                    'myapp:empty': null,
                },
            },
        });

        await action.handler(ctx as any);

        // Should have 2 calls: pulumi new + 1 config set (null value skipped)
        expect(executeShellCommand).toHaveBeenCalledTimes(2);
    });
});

import { PassThrough } from 'stream';

interface MockLogger {
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    child: jest.Mock;
}

/**
 * Creates a mock action context for testing scaffolder actions
 */
export function createMockActionContext(overrides?: {
    input?: Record<string, any>;
    workspacePath?: string;
}) {
    const mockLogger: MockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn((): MockLogger => mockLogger),
    };

    const mockOutput = jest.fn();

    return {
        logger: mockLogger,
        logStream: new PassThrough(),
        workspacePath: overrides?.workspacePath ?? '/tmp/test-workspace',
        output: mockOutput,
        createTemporaryDirectory: jest.fn().mockResolvedValue('/tmp/temp-dir'),
        checkpoint: jest.fn(),
        getInitiatorCredentials: jest.fn(),
        input: overrides?.input ?? {},
    };
}

/**
 * Creates a mock stack object for LocalWorkspace tests
 */
export function createMockStack(overrides?: {
    name?: string;
    outputs?: Record<string, { value: any; secret?: boolean }>;
    changeSummary?: Record<string, number>;
    resourceChanges?: Record<string, number>;
}) {
    const mockStack = {
        name: overrides?.name ?? 'org/project/stack',
        refresh: jest.fn().mockResolvedValue({}),
        up: jest.fn().mockResolvedValue({
            summary: {
                resourceChanges: overrides?.resourceChanges ?? { create: 1 },
            },
            outputs: overrides?.outputs ?? {},
        }),
        preview: jest.fn().mockResolvedValue({
            changeSummary: overrides?.changeSummary ?? { create: 1 },
        }),
        destroy: jest.fn().mockResolvedValue({
            summary: {
                resourceChanges: overrides?.resourceChanges ?? { delete: 1 },
            },
        }),
        addEnvironments: jest.fn().mockResolvedValue(undefined),
        workspace: {
            removeStack: jest.fn().mockResolvedValue(undefined),
        },
    };
    return mockStack;
}

/**
 * Creates a mock fetch response
 */
export function createMockFetchResponse(options: {
    ok: boolean;
    status?: number;
    statusText?: string;
    json?: any;
    text?: string;
}) {
    return {
        ok: options.ok,
        status: options.status ?? (options.ok ? 200 : 400),
        statusText: options.statusText ?? (options.ok ? 'OK' : 'Bad Request'),
        json: jest.fn().mockResolvedValue(options.json ?? {}),
        text: jest.fn().mockResolvedValue(options.text ?? ''),
    };
}

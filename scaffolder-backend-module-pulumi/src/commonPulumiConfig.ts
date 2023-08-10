import {z} from 'zod';

const commonPulumiConfigSchema = z.object({
    stack: z.string({description: 'The Pulumi stack to use'}),
    organization: z.string({description: 'The Pulumi organization to use for the Pulumi commands'}),
    name: z.string({description: 'The Pulumi project name to use'}),
});

export default commonPulumiConfigSchema;

import { pulumiPlugin } from './plugin';

describe('pulumi', () => {
  it('should export plugin', () => {
    expect(pulumiPlugin).toBeDefined();
  });
});

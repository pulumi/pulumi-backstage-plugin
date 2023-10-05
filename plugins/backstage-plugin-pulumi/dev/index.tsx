import { createDevApp } from '@backstage/dev-utils';
import { pulumiPlugin } from '../src';

createDevApp()
  .registerPlugin(pulumiPlugin)
  .render();

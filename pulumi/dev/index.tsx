import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { pulumiPlugin, PulumiPage } from '../src/plugin';

createDevApp()
  .registerPlugin(pulumiPlugin)
  .addPage({
    element: <PulumiPage />,
    title: 'Root Page',
    path: '/pulumi'
  })
  .render();

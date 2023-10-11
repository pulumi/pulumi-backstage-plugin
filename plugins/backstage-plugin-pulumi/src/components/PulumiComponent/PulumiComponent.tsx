import React from 'react';
import {
  Page,
  Content,
} from '@backstage/core-components';
import { ActivityTable } from '../ActivityTable';

export const PulumiComponent = () => (
    <Page themeId="tool">
        <Content>
        <ActivityTable />
        </Content>
    </Page>
    );

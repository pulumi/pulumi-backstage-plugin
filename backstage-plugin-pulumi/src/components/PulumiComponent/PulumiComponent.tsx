import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { EntityPulumiCard } from '../../plugin';
import { ActivityTable } from '../ActivityTable/ActivityTable';

export const PulumiComponent = () => (
    <Page themeId="tool">
        <Content>
        <ActivityTable />
        </Content>
    </Page>
    );
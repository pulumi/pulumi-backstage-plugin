import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Content, Header, Page, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { pulumiApiRef } from '../../api';
import { UnauthorizedError } from '../../api/client';
import {
    User,
    UserOrganization,
    PulumiMetadata,
    Dashboard,
    Deployment,
    UserStack,
    ResourceSummaryPoint,
} from '../../api/types';
import { DashboardHeader } from './DashboardHeader';
import { StatsCards } from './StatsCards';
import { LatestStackUpdates } from './LatestStackUpdates';
import { LatestDeployments } from './LatestDeployments';
import { ResourceChart } from './ResourceChart';

// Helper to get the org slug (URL-safe identifier) for API calls
const getOrgSlug = (org: UserOrganization): string => {
    // Pulumi API may use 'login', 'githubLogin', or 'name' depending on org type
    // For personal accounts, login/githubLogin is the org slug (e.g., "dirien")
    // For team orgs, name is typically already the slug
    return org.login || org.githubLogin || org.name;
};

const useStyles = makeStyles(theme => ({
    content: {
        padding: theme.spacing(3),
    },
    section: {
        marginBottom: theme.spacing(3),
    },
    errorContainer: {
        padding: theme.spacing(3),
    },
}));

type OrgData = {
    metadata: PulumiMetadata;
    dashboard: Dashboard;
    deployments: Deployment[];
    stacks: UserStack[];
    resourceHistory: ResourceSummaryPoint[];
    environmentCount: number;
};

export const PulumiDashboardPage = () => {
    const classes = useStyles();
    const api = useApi(pulumiApiRef);

    const [user, setUser] = useState<User | null>(null);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [orgData, setOrgData] = useState<OrgData | null>(null);
    const [loading, setLoading] = useState(true);
    const [orgLoading, setOrgLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initial load - fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const userData = await api.getCurrentUser();
                // Debug: log the API response to understand the structure
                console.log('Pulumi User API response:', JSON.stringify(userData, null, 2));
                console.log('Organizations:', userData.organizations);
                if (userData.organizations?.length > 0) {
                    console.log('First org:', userData.organizations[0]);
                    console.log('First org slug:', getOrgSlug(userData.organizations[0]));
                }
                setUser(userData);
                if (userData.organizations?.length > 0) {
                    setSelectedOrg(getOrgSlug(userData.organizations[0]));
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [api]);

    // Fetch organization data when selected org changes
    const fetchOrgData = useCallback(async (org: string, granularity = 'daily', lookbackDays = 30) => {
        if (!org) return;

        try {
            setOrgLoading(true);
            const [metadata, dashboard, deploymentsResult, stacksResult, resourceHistory, environmentsResult] = await Promise.all([
                api.getMetadata(org),
                api.getDasboard(org, 'package', 5),
                api.listDeployments(org, 1, 10).catch(() => ({ deployments: [], itemsPerPage: 0, total: 0 })),
                api.listUserStacks(org).catch(() => ({ stacks: [] })),
                api.getResourceHistory(org, granularity, lookbackDays).catch(() => ({ summary: [] })),
                api.listEscEnvironments(org).catch(() => ({ environments: [] })),
            ]);

            setOrgData({
                metadata,
                dashboard,
                deployments: deploymentsResult.deployments,
                stacks: stacksResult.stacks,
                resourceHistory: resourceHistory.summary,
                environmentCount: environmentsResult.environments?.length || 0,
            });
        } catch (err) {
            setError(err as Error);
        } finally {
            setOrgLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (selectedOrg) {
            fetchOrgData(selectedOrg);
        }
    }, [selectedOrg, fetchOrgData]);

    const handleOrgChange = (org: string) => {
        setSelectedOrg(org);
    };

    const handleTimeRangeChange = async (granularity: string, lookbackDays: number) => {
        if (!selectedOrg) return;

        try {
            setChartLoading(true);
            const resourceHistory = await api.getResourceHistory(selectedOrg, granularity, lookbackDays);
            setOrgData(prev => prev ? { ...prev, resourceHistory: resourceHistory.summary } : null);
        } catch (err) {
            console.error('Failed to fetch resource history:', err);
        } finally {
            setChartLoading(false);
        }
    };

    if (loading) {
        return (
            <Page themeId="tool">
                <Header title="Pulumi Dashboard" />
                <Content>
                    <Progress />
                </Content>
            </Page>
        );
    }

    if (error) {
        const isUnauthorized = error instanceof UnauthorizedError;
        return (
            <Page themeId="tool">
                <Header title="Pulumi Dashboard" />
                <Content>
                    <Box className={classes.errorContainer}>
                        <Alert severity="error">
                            {isUnauthorized
                                ? 'You are not authorized to access Pulumi. Please check your API token configuration.'
                                : `Error loading dashboard: ${error.message}`}
                        </Alert>
                    </Box>
                </Content>
            </Page>
        );
    }

    if (!user || user.organizations.length === 0) {
        return (
            <Page themeId="tool">
                <Header title="Pulumi Dashboard" />
                <Content>
                    <Box className={classes.errorContainer}>
                        <Alert severity="info">
                            No Pulumi organizations found for your account.
                        </Alert>
                    </Box>
                </Content>
            </Page>
        );
    }

    return (
        <Page themeId="tool">
            <Header title="Pulumi Dashboard" />
            <Content className={classes.content}>
                <DashboardHeader
                    organizations={user.organizations}
                    selectedOrg={selectedOrg}
                    onOrgChange={handleOrgChange}
                />

                {orgLoading ? (
                    <Progress />
                ) : orgData ? (
                    <>
                        <Box className={classes.section}>
                            <StatsCards
                                memberCount={orgData.metadata.memberCount}
                                stackCount={orgData.metadata.stackCount}
                                environmentCount={orgData.environmentCount}
                                resourceCount={orgData.dashboard.total}
                            />
                        </Box>

                        <Box className={classes.section}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <LatestStackUpdates
                                        stacks={orgData.stacks}
                                        orgName={selectedOrg}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <LatestDeployments
                                        deployments={orgData.deployments}
                                        orgName={selectedOrg}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box className={classes.section}>
                            <ResourceChart
                                data={orgData.resourceHistory}
                                loading={chartLoading}
                                onTimeRangeChange={handleTimeRangeChange}
                            />
                        </Box>
                    </>
                ) : null}
            </Content>
        </Page>
    );
};

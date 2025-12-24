import {ComponentProps, ReactNode} from 'react';
import {
    PULUMI_ORGA_SLUG_ANNOTATION,
    PULUMI_PROJECT_SLUG_ANNOTATION
} from '../constants';
import {parseAnnotationValues} from '../utils';
import {Entity} from '@backstage/catalog-model';
import {pulumiApiRef} from '../../api';
import {Stack, ProjectDetail, PulumiMetadata, Dashboard} from '../../api/types';
import {useEntity} from '@backstage/plugin-catalog-react';
import {
    Progress,
    InfoCard,
    BottomLinkProps,
    TabbedCard,
    CardTab,
} from '@backstage/core-components';
import {useApi} from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import {UnauthorizedError} from '../../api/client';
import {NotFoundError} from '@backstage/errors';
import {Alert} from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Cloud from '@material-ui/icons/Cloud';
import {
    CardContent,
    CardHeader,
    Grid,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import {PulumiIcon} from '../PulumiIcon';
import {tableRowAlternate} from '../../styles';

type StackData = {
    stack: Stack;
    project: ProjectDetail;
    slug: string;
};

type PulumiCardProps = {
    children: ReactNode;
    deepLink?: BottomLinkProps
} & ComponentProps<typeof InfoCard>;

const PulumiCard = ({children, deepLink, ...rest}: PulumiCardProps) => (
    <InfoCard deepLink={deepLink} {...rest}>
        <CardHeader title="Pulumi"
                    avatar={
                        <PulumiIcon style={{fontSize: 40}}/>
                    }
                    titleTypographyProps={
                        {variant: 'h5'}
                    }
        />
        {children}
    </InfoCard>
);

export const isPluginApplicableToEntity = (entity: Entity) =>
    Boolean(
        entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION] ||
        entity.metadata.annotations?.[PULUMI_ORGA_SLUG_ANNOTATION]
    );

type OrgData = {
    orgName: string;
    metadata: PulumiMetadata;
    dashboard: Dashboard;
};

const OrgContent = ({orgData}: {orgData: OrgData}) => {
    const providerResults = orgData.dashboard.aggregations?.package?.results || [];
    const othersCount = orgData.dashboard.aggregations?.package?.others || 0;

    const metadataRows = [
        {label: 'name', value: orgData.orgName},
        {label: 'memberCount', value: orgData.metadata.memberCount},
        {label: 'totalStacks', value: orgData.metadata.stackCount},
        {label: 'product', value: orgData.metadata.product},
        {label: 'subscriptionStatus', value: orgData.metadata.subscriptionStatus},
    ];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Table size="small" style={{tableLayout: 'fixed'}}>
                    <TableBody>
                        {metadataRows.map((row, index) => (
                            <TableRow key={row.label} style={{backgroundColor: index % 2 === 1 ? tableRowAlternate : 'transparent'}}>
                                <TableCell style={{fontWeight: 500, width: '50%'}}>{row.label}</TableCell>
                                <TableCell>{row.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Grid>
            <Grid item xs={12}>
                <Accordion TransitionProps={{unmountOnExit: true}}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>} title='sd'>
                        <Cloud style={{fontSize: 40}}/>
                        <Typography variant="h6" style={{marginTop: 5, marginLeft: 5}}>
                            Resources by provider
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails style={{padding: 0}}>
                        <Table size="small" style={{tableLayout: 'fixed'}}>
                            <TableBody>
                                {providerResults.map((result, index) => (
                                    <TableRow key={result.name} style={{backgroundColor: index % 2 === 1 ? tableRowAlternate : 'transparent'}}>
                                        <TableCell style={{fontWeight: 500, width: '50%'}}>{result.name}</TableCell>
                                        <TableCell>{result.count}</TableCell>
                                    </TableRow>
                                ))}
                                {othersCount > 0 && (
                                    <TableRow style={{backgroundColor: providerResults.length % 2 === 1 ? tableRowAlternate : 'transparent'}}>
                                        <TableCell style={{fontWeight: 500, width: '50%'}}>other</TableCell>
                                        <TableCell>{othersCount}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>
            </Grid>
        </Grid>
    );
};

export const EntityPulumiMetdataCard = () => {
    const {entity} = useEntity();
    const api = useApi(pulumiApiRef);

    const orgNames = parseAnnotationValues(
        entity.metadata.annotations?.[PULUMI_ORGA_SLUG_ANNOTATION]
    );

    const {
        value: orgs,
        loading,
        error,
    } = useAsync(async () => {
        if (orgNames.length === 0) {
            return [];
        }

        const results = await Promise.all(
            orgNames.map(async (orgName) => {
                const organization = await api.getMetadata(orgName);
                const packages = await api.getDasboard(orgName, 'package', 5);
                return {
                    orgName,
                    metadata: organization,
                    dashboard: packages,
                } as OrgData;
            })
        );

        return results;
    }, [orgNames.join(',')]);

    if (error) {
        let errorNode: ReactNode;

        switch (error.constructor) {
            case UnauthorizedError:
                errorNode = (
                    <Alert severity="error">
                        You are not authorized to view this information.
                    </Alert>
                );
                break;
            case NotFoundError:
                errorNode = (
                    <Alert severity="error">
                        No information found for this entity.
                    </Alert>
                );
                break;
            default:
                errorNode = (
                    <Alert severity="error">
                        Error encountered while fetching information. {error.message}
                    </Alert>
                );
        }

        return <PulumiCard>{errorNode}</PulumiCard>;
    }

    if (loading) {
        return (
            <PulumiCard>
                <CardContent>
                    <Progress/>
                </CardContent>
            </PulumiCard>
        );
    }

    if (!orgs || orgs.length === 0) {
        return (
            <PulumiCard>
                <CardContent>
                    <Alert severity="info">
                        No Pulumi organizations configured for this entity.
                    </Alert>
                </CardContent>
            </PulumiCard>
        );
    }

    // Single org - render without tabs (backwards compatible)
    if (orgs.length === 1) {
        const orgData = orgs[0];
        return (
            <PulumiCard deepLink={{title: "Dashboard", link: `https://app.pulumi.com/${orgData.orgName}/`}}>
                <CardContent>
                    <OrgContent orgData={orgData} />
                </CardContent>
            </PulumiCard>
        );
    }

    // Multiple orgs - render with tabs
    return (
        <TabbedCard title="Pulumi Organizations">
            {orgs.map((orgData) => (
                <CardTab key={orgData.orgName} label={orgData.orgName}>
                    <CardContent>
                        <OrgContent orgData={orgData} />
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{marginTop: 16}}
                        >
                            <a
                                href={`https://app.pulumi.com/${orgData.orgName}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open Dashboard →
                            </a>
                        </Typography>
                    </CardContent>
                </CardTab>
            ))}
        </TabbedCard>
    );
};


const StackContent = ({stackData}: {stackData: StackData}) => {
    const metadataRows = [
        {label: 'name', value: stackData.stack.stackName},
        {label: 'projectName', value: stackData.stack.projectName},
        {label: 'orgName', value: stackData.stack.orgName},
        {label: 'repositoryName', value: stackData.project.project.repoName},
        {label: 'runtime', value: stackData.project.project.runtime},
    ];

    return (
        <Table size="small" style={{tableLayout: 'fixed'}}>
            <TableBody>
                {metadataRows.map((row, index) => (
                    <TableRow key={row.label} style={{backgroundColor: index % 2 === 1 ? tableRowAlternate : 'transparent'}}>
                        <TableCell style={{fontWeight: 500, width: '50%'}}>{row.label}</TableCell>
                        <TableCell>{row.value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const EntityPulumiCard = () => {
    const {entity} = useEntity();
    const api = useApi(pulumiApiRef);

    const slugs = parseAnnotationValues(
        entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]
    );

    const {
        value: stacks,
        loading,
        error,
    } = useAsync(async () => {
        if (slugs.length === 0) {
            return [];
        }

        const results = await Promise.all(
            slugs.map(async (slug) => {
                const stack = await api.getStack(slug);
                const project = await api.getProjectDetails(stack.orgName, stack.projectName);
                return {
                    stack,
                    project,
                    slug,
                } as StackData;
            })
        );

        return results;
    }, [slugs.join(',')]);

    if (error) {
        let errorNode: ReactNode;

        switch (error.constructor) {
            case UnauthorizedError:
                errorNode = (
                    <Alert severity="error">
                        You are not authorized to view this information.
                    </Alert>
                );
                break;
            case NotFoundError:
                errorNode = (
                    <Alert severity="info">
                        No information found for this entity.
                    </Alert>
                );
                break;
            default:
                errorNode = (
                    <Alert severity="error">
                        Error encountered while fetching information. {error.message}
                    </Alert>
                );
        }

        return (
            <PulumiCard>
                <CardContent>
                    {errorNode}
                </CardContent>
            </PulumiCard>
        )
    }

    if (loading) {
        return (
            <PulumiCard>
                <CardContent>
                    <Progress/>
                </CardContent>
            </PulumiCard>
        );
    }

    if (!stacks || stacks.length === 0) {
        return (
            <PulumiCard>
                <CardContent>
                    <Alert severity="info">
                        No Pulumi stacks configured for this entity.
                    </Alert>
                </CardContent>
            </PulumiCard>
        );
    }

    // Single stack - render without tabs (backwards compatible)
    if (stacks.length === 1) {
        const stackData = stacks[0];
        return (
            <PulumiCard deepLink={{
                title: "Pulumi Console",
                link: `https://app.pulumi.com/${stackData.stack.orgName}/${stackData.stack.projectName}/${stackData.stack.stackName}`
            }}>
                <CardContent>
                    <StackContent stackData={stackData} />
                </CardContent>
            </PulumiCard>
        );
    }

    // Multiple stacks - render with tabs
    return (
        <TabbedCard title="Pulumi Stacks">
            {stacks.map((stackData) => (
                <CardTab
                    key={stackData.slug}
                    label={`${stackData.stack.projectName}/${stackData.stack.stackName}`}
                >
                    <CardContent>
                        <StackContent stackData={stackData} />
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            style={{marginTop: 16}}
                        >
                            <a
                                href={`https://app.pulumi.com/${stackData.stack.orgName}/${stackData.stack.projectName}/${stackData.stack.stackName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open in Pulumi Console →
                            </a>
                        </Typography>
                    </CardContent>
                </CardTab>
            ))}
        </TabbedCard>
    );
};

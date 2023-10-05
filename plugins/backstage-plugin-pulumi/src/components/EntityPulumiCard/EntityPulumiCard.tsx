import React, {ComponentProps, ReactNode} from 'react';
import {
    PULUMI_ORGA_SLUG_ANNOTATION, 
    PULUMI_PROJECT_SLUG_ANNOTATION
} from '../constants';
import {Entity} from '@backstage/catalog-model';
import {pulumiApiRef} from '../../api';
import {useEntity} from '@backstage/plugin-catalog-react';
import {
    Progress,
    StructuredMetadataTable,
    InfoCard,
    BottomLinkProps,
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
} from '@material-ui/core';
import {PulumiIcon} from '../PulumiIcon';

type PulumiCardProps = {
    children: ReactNode;
    deepLink?: BottomLinkProps
} & ComponentProps<typeof InfoCard>;

const PulumiCard = ({children,deepLink, ...rest}: PulumiCardProps) => (
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
    
export const EntityPulumiMetdataCard = () => {

    const {entity} = useEntity();
    const api = useApi(pulumiApiRef);
    const orgName = entity.metadata.annotations?.[PULUMI_ORGA_SLUG_ANNOTATION];

    const {
        value: systemCard,
        loading,
        error,
    } = useAsync(async () => {
        const organization = await api.getMetadata(orgName ?? '');

        const packages = await api.getDasboard(orgName ?? '', 'package',5);
    
        return  {
            dashboard: packages,
            metadata: organization,
        };
    });

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


    const metadata = systemCard?.dashboard.aggregations?.package.results.reduce(
        (acc, result) => {
          acc[result.name] = result.count;
          return acc;
        },
        {} as Record<string, number>
      ) || {} as Record<string, number>;
      // add the "Other" category
    metadata['Other'] = systemCard?.dashboard.aggregations?.package.others || 0;


    return (
        <PulumiCard deepLink={{title:"Dashboard",link:`https://app.pulumi.com/${orgName}/`}}>
            <CardContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <StructuredMetadataTable
                            dense
                            metadata={{
                                name: orgName,
                                memberCount: systemCard?.metadata.memberCount,
                                totalStacks: systemCard?.metadata.stackCount,
                                product: systemCard?.metadata.product,
                                subscriptionStatus: systemCard?.metadata.subscriptionStatus,
                            }
                            }/>   
                    </Grid>
                    <Grid item xs={12}>
                        <Accordion TransitionProps={{ unmountOnExit: true }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} title='sd' >
                                <Cloud style={{fontSize: 40}}/>
                                <Typography variant="h6" style={{marginTop: 5, marginLeft: 5}}>Resources by provider</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid item xs={12}>
                                <StructuredMetadataTable
                                        dense
                                        metadata={metadata ? metadata : {}}/>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                    
                </Grid>
            </CardContent>
        </PulumiCard>
    );
};



export const EntityPulumiCard = () => {
    const {entity} = useEntity();
    const api = useApi(pulumiApiRef);
    
    const {
        value: stack,
        loading,
        error,
    } = useAsync(async () => {
        const stacks = await api.getStack(entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION] ?? '');

        const project = await api.getProjectDetails(stacks.orgName,stacks.projectName)
        return  {
            stack: stacks,
            project: project,
        };
    });

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

    return (
        <PulumiCard deepLink={{title:"Pulumi Console",link:`https://app.pulumi.com/${stack?.stack.orgName}/${stack?.stack.projectName}/${stack?.stack.stackName}`}}>
            <CardContent>
                <StructuredMetadataTable
                    dense
                    metadata={{
                        name: stack?.stack.stackName,
                        projectName: stack?.stack.projectName,
                        orgName: stack?.stack.orgName,
                        repositoryName: stack?.project.project.repoName,
                        runtime: stack?.project.project.runtime
                    }
                    }/>
            </CardContent>
        </PulumiCard>
    );
};

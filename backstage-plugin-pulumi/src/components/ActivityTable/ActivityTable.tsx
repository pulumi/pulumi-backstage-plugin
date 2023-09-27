import {useApi} from "@backstage/core-plugin-api";
import {PULUMI_PROJECT_SLUG_ANNOTATION} from "../constants";
import {pulumiApiRef} from '../../api';
import {useEntity} from '@backstage/plugin-catalog-react';
import {Entity} from '@backstage/catalog-model';
import React from "react";
import {
    StatusError,
    StatusOK,
    Link,
    Table,
    TableColumn,
    Avatar,
    StatusRunning
} from '@backstage/core-components';
import {Box, Button, Grid, ListItem, ListItemIcon, ListItemText, Typography} from "@material-ui/core";
import {ResourceChanges} from "../../api/types";
import { DeploymentIcon } from "../PulumiIcon";


export const isPluginApplicableToEntity = (entity: Entity) =>
    Boolean(
        entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]
    );


export const ActivityTable = () => {
    const {entity} = useEntity();
    const api = useApi(pulumiApiRef);

    /*
    const {
        value: service,
        loading,
        error,
    } = useAsync(async () => {
        const previews = (await api.getPreviews(entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION] ?? ''));

        return {
            previews
        }
    });


    if (error) {
        let errorNode: ReactNode;
        const orgName = entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION].split("/")[0];
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
                    <List>
                        <ListItem>
                            <Typography variant="h4">
                                No stack informations found for this project
                            </Typography>
                        </ListItem>
                        <ListItem>
                            <Button variant="contained" color="primary"
                                    href={`https://app.pulumi.com/site/new-project?owner=${orgName}`}>
                                Create new project
                            </Button>
                        </ListItem>
                        <ListItem>
                            <EmptyState
                                missing="info"
                                title=""
                                description="It looks like there is no Pulumi project associated with this entity. You can create a new project by clicking the button above."
                            />
                        </ListItem>
                    </List>
                );
                break;
            default:
                errorNode = (
                    <Alert severity="error">
                        Error encountered while fetching information. {error.message}
                    </Alert>
                );
        }

        return <Box>{errorNode}</Box>;
    }


    if (loading) {
        return (
            <Box>
                <Progress/>
            </Box>
        );
    }
*/
    const columns: TableColumn[] = [
        {
            title: 'Type', render: (row: any) => {
                const obj = row.update ?? row.deployment.updates[0]
                const KindWrapper = () => {
                    const addIcon = () => {
                        if (row.update === undefined) {
                            return (
                                <Grid item>
                                    <DeploymentIcon style={{fontSize: 30}}/>  
                                </Grid>     
                            )
                        }
                        return null;
                    }
                    let kind = obj.info.kind;
                    let linkUrl = `https://app.pulumi.com/${entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]}/updates/${obj.info.version}`
                    if (obj.info.kind.startsWith("P")) {
                        kind = "Preview of Update"
                        linkUrl = `https://app.pulumi.com/${entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]}/previews/${obj.updateID}`
                    } else {
                        kind = "Update"
                    }
                    kind = `${kind}  #${obj.info.version}`

                    if (obj.info.kind.indexOf("refresh") !== -1) {

                        kind = `${kind} (refresh)`
                    }
                    return (
                        
                        <Link
                            to={linkUrl}>
                            <Grid container direction="row" alignItems="center" spacing={2}>   
                                {addIcon()}
                                <Typography variant="body1" noWrap>
                                    {kind}
                                </Typography>
                            </Grid>
                        </Link>
                    );
                };
                return <KindWrapper/>
            }
        },
        {
            title: 'Status', field: 'result', render: (row: any) => {
                const obj = row.update ?? row.deployment.updates[0]
                const StatusWrapper = () => {
                    let status = <StatusOK>{obj.info.result}</StatusOK>
                    if (obj.info.result !== "succeeded") {
                        status = <StatusError>{obj.info.result}</StatusError>
                    } else if (obj.info.result === "in-progress") {
                        status = <StatusRunning>{obj.info.result}</StatusRunning>
                    }
                    return (
                        status
                    );
                };

                return <StatusWrapper/>
            }

        },
        {
            title: 'Message', field: 'message', render: (row: any) => {
                const StatusWrapper = () => {
                    const obj = row.update ?? row.deployment.updates[0]
                    return (
                        <Typography variant="body1" noWrap>
                            {obj.info.message}
                        </Typography>
                    );
                };
                return <StatusWrapper/>
            }
        },
        {
            title: 'Resources', field: 'resourceCount', render: (row: any) => {
                const StatusWrapper = () => {
                    const obj = row.update ?? row.deployment.updates[0]
                    return (
                        <Typography variant="body1" noWrap>
                            {obj.info.resourceCount ?? 0}
                        </Typography>
                    );
                };
                return <StatusWrapper/>
            }
        },
        {
            title: 'Requested By', render: (row: any) => {
                const obj = row.update ?? row.deployment.updates[0]
                const StatusWrapper = () => {
                    return (
                        <ListItem>
                            <ListItemIcon>
                                <Avatar displayName={obj.requestedBy.name} picture={obj.requestedBy.avatarUrl}
                                        customStyles={{width: 40, height: 40}}/>
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography>
                                        {obj.requestedBy.name}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    );
                };
                return <StatusWrapper/>
            }
        },
        {
            title: 'Changes', field: 'resourceChanges', render: (row: any) => {
                const obj = row.update ?? row.deployment.updates[0]
                const ResourceChangeWrapper = ({resourceChanges}: { resourceChanges: ResourceChanges }) => {
                    const renderButton = (label: string, value: number | undefined, color: string, fontColor?: string) => {
                        if (value && value > 0) {
                            return (
                                <Button disabled disableElevation variant="outlined"
                                        style={{borderRadius: 0, backgroundColor: color, color: fontColor ?? "white"}}>
                                    <Typography variant="body1">{label}{value}</Typography>
                                </Button>
                            );
                        }
                        return null; // Return null if you don't want to render anything
                    };

                    return (
                        <Box>
                            {renderButton("+", resourceChanges ? resourceChanges.create : 0, "#437e37")}
                            {renderButton("~", resourceChanges ? resourceChanges.update : 0, "#fed05d", "#313131")}
                            {renderButton("", resourceChanges ? resourceChanges.same : 0, "#b0b0b0", "#313131")}
                            {renderButton("-", resourceChanges ? resourceChanges.delete : 0, "#9e2626")}
                        </Box>
                    );
                };
                return <ResourceChangeWrapper resourceChanges={obj.info.resourceChanges}/>;
            }
        },

    ];

    const previewData = async (_query: { page: number, pageSize: number }) => {
        const previews = (await api.getPreviews(entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION] ?? ''));
        if (previews.updates) {
            previews.updates = previews.updates.slice(0, 3);
        }
        const transformedData = {
            updates: previews.updates?.map((activityItem) => {
                return {
                    update: {
                        ...activityItem,
                    },
                };
            }),
            itemsPerPage: previews.itemsPerPage,
            total: previews.total, // Set the total to the number of updates
        };

        return {
            data: transformedData.updates ?? [],
            page: 0,
            totalCount: transformedData.total,
        }
    }

    const activityData = async (query: { page: number, pageSize: number }) => {
        if (query) {
            const updates = (await api.listStackUpdates(entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION] ?? '', query.page + 1, query.pageSize));
            return {
                data: updates.activity ?? [],
                page: query.page,
                totalCount: updates.total,
            }
        }
        return {
            data: [],
            page: 1,
            totalCount: 0,
        }
    }

    return (
        <Box>
            <Box marginBottom={5}>
                <Table
                    title="Recent Previews"
                    options={{search: false, paging: false, pageSize: 3}}
                    columns={columns.slice(0, -1)}
                    data={previewData}
                />
            </Box>
            <Box>
                <Table
                    title="Activity"
                    options={{search: true, paging: true, pageSize: 5}}
                    columns={columns}
                    data={activityData}
                />
            </Box>
        </Box>
    );
};

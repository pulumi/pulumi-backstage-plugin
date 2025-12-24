import {useState} from 'react';
import {useApi} from "@backstage/core-plugin-api";
import {PULUMI_PROJECT_SLUG_ANNOTATION} from "../constants";
import {parseAnnotationValues} from "../utils";
import {pulumiApiRef} from '../../api';
import {useEntity} from '@backstage/plugin-catalog-react';
import {Entity} from '@backstage/catalog-model';
import {
    StatusError,
    StatusOK,
    Link,
    Table,
    TableColumn,
    Avatar,
    StatusRunning
} from '@backstage/core-components';
import {Box, Button, Grid, ListItem, ListItemIcon, ListItemText, Typography, Tabs, Tab} from "@material-ui/core";
import {ResourceChanges} from "../../api/types";
import {DeploymentIcon} from "../PulumiIcon";
import {statusColors, statusTextColors} from "../../styles";


export const isPluginApplicableToEntity = (entity: Entity) =>
    Boolean(
        entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]
    );


const ActivityTableContent = ({slug}: {slug: string}) => {
    const api = useApi(pulumiApiRef);

    const columns: TableColumn[] = [
        {
            title: 'Type', render: (row: any) => {
                const obj = row.update ?? row.deployment?.updates?.[0]
                const KindWrapper = () => {
                    if (!obj?.info) {
                        return <Typography variant="body1">-</Typography>;
                    }
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
                    let kind = obj.info.kind ?? '';
                    let linkUrl = `https://app.pulumi.com/${slug}/updates/${obj.info.version}`
                    if (kind.startsWith("P")) {
                        kind = "Preview of Update"
                        linkUrl = `https://app.pulumi.com/${slug}/previews/${obj.updateID}`
                    } else {
                        kind = "Update"
                    }
                    kind = `${kind}  #${obj.info.version ?? ''}`

                    if ((obj.info.kind ?? '').indexOf("refresh") !== -1) {

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
                const obj = row.update ?? row.deployment?.updates?.[0]
                const StatusWrapper = () => {
                    if (!obj?.info) {
                        return <Typography variant="body1">-</Typography>;
                    }
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
                    const obj = row.update ?? row.deployment?.updates?.[0]
                    return (
                        <Typography variant="body1" noWrap>
                            {obj?.info?.message ?? '-'}
                        </Typography>
                    );
                };
                return <StatusWrapper/>
            }
        },
        {
            title: 'Resources', field: 'resourceCount', render: (row: any) => {
                const StatusWrapper = () => {
                    const obj = row.update ?? row.deployment?.updates?.[0]
                    return (
                        <Typography variant="body1" noWrap>
                            {obj?.info?.resourceCount ?? 0}
                        </Typography>
                    );
                };
                return <StatusWrapper/>
            }
        },
        {
            title: 'Requested By', render: (row: any) => {
                const obj = row.update ?? row.deployment?.updates?.[0]
                const StatusWrapper = () => {
                    if (!obj?.requestedBy) {
                        return <Typography variant="body1">-</Typography>;
                    }
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
                const obj = row.update ?? row.deployment?.updates?.[0]
                const ResourceChangeWrapper = ({resourceChanges}: { resourceChanges: ResourceChanges | undefined }) => {
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
                            {renderButton("+", resourceChanges ? resourceChanges.create : 0, statusColors.create, statusTextColors.create)}
                            {renderButton("~", resourceChanges ? resourceChanges.update : 0, statusColors.update, statusTextColors.update)}
                            {renderButton("", resourceChanges ? resourceChanges.same : 0, statusColors.same, statusTextColors.same)}
                            {renderButton("-", resourceChanges ? resourceChanges.delete : 0, statusColors.delete, statusTextColors.delete)}
                        </Box>
                    );
                };
                return <ResourceChangeWrapper resourceChanges={obj?.info?.resourceChanges}/>;
            }
        },

    ];

    const previewData = async (_query: { page: number, pageSize: number }) => {
        try {
            const previews = (await api.getPreviews(slug));
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
                total: previews.total,
            };

            return {
                data: transformedData.updates ?? [],
                page: 0,
                totalCount: transformedData.total,
            }
        } catch (e) {
            return {
                data: [],
                page: 0,
                totalCount: 0,
            }
        }
    }

    const activityData = async (query: { page: number, pageSize: number }) => {
        if (query) {
            try {
                const updates = (await api.listStackUpdates(slug, query.page + 1, query.pageSize));
                return {
                    data: updates.activity ?? [],
                    page: query.page,
                    totalCount: updates.total,
                }
            } catch (e) {
                return {
                    data: [],
                    page: query.page,
                    totalCount: 0,
                }
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

export const ActivityTable = () => {
    const {entity} = useEntity();

    const slugs = parseAnnotationValues(
        entity.metadata.annotations?.[PULUMI_PROJECT_SLUG_ANNOTATION]
    );

    const [selectedTab, setSelectedTab] = useState(0);

    if (slugs.length === 0) {
        return (
            <Box>
                <Typography variant="body1">
                    No Pulumi stacks configured for this entity.
                </Typography>
            </Box>
        );
    }

    // Single stack - render without tabs (backwards compatible)
    if (slugs.length === 1) {
        return <ActivityTableContent slug={slugs[0]} />;
    }

    // Multiple stacks - render with tabs
    const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setSelectedTab(newValue);
    };

    // Extract project/stack name from slug for tab label
    const getTabLabel = (slug: string) => {
        const parts = slug.split('/');
        if (parts.length >= 3) {
            return `${parts[1]}/${parts[2]}`; // project/stack
        }
        return slug;
    };

    return (
        <Box>
            <Box marginBottom={2}>
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {slugs.map((slug, index) => (
                        <Tab key={slug} label={getTabLabel(slug)} id={`stack-tab-${index}`} />
                    ))}
                </Tabs>
            </Box>
            <ActivityTableContent key={slugs[selectedTab]} slug={slugs[selectedTab]} />
        </Box>
    );
};

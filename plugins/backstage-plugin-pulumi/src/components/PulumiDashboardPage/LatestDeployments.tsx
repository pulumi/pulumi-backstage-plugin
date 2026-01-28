import {
    Avatar,
    Box,
    Chip,
    Link,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    makeStyles,
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { Deployment } from '../../api/types';
import { tableRowAlternate, statusColors } from '../../styles';

const useStyles = makeStyles(theme => ({
    table: {
        tableLayout: 'fixed',
    },
    headerCell: {
        fontWeight: 600,
    },
    link: {
        fontWeight: 500,
        '&:hover': {
            textDecoration: 'underline',
        },
    },
    noData: {
        padding: theme.spacing(3),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    timestamp: {
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
    },
    statusChip: {
        fontWeight: 500,
        textTransform: 'capitalize',
    },
    userCell: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    avatar: {
        width: 24,
        height: 24,
    },
}));

type LatestDeploymentsProps = {
    deployments: Deployment[];
    orgName: string;
};

const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'succeeded':
        case 'success':
            return statusColors.success;
        case 'failed':
        case 'failure':
            return statusColors.error;
        case 'running':
        case 'pending':
            return statusColors.running;
        default:
            return '#757575';
    }
};

const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const LatestDeployments = ({ deployments, orgName }: LatestDeploymentsProps) => {
    const classes = useStyles();

    const recentDeployments = deployments.slice(0, 10);

    return (
        <InfoCard title="Latest Deployments">
            {recentDeployments.length === 0 ? (
                <Typography className={classes.noData}>
                    No recent deployments
                </Typography>
            ) : (
                <Table size="small" className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell className={classes.headerCell}>Project / Stack</TableCell>
                            <TableCell className={classes.headerCell}>Status</TableCell>
                            <TableCell className={classes.headerCell}>Requested By</TableCell>
                            <TableCell className={classes.headerCell}>Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentDeployments.map((deployment, index) => (
                            <TableRow
                                key={deployment.id}
                                style={{ backgroundColor: index % 2 === 1 ? tableRowAlternate : 'transparent' }}
                            >
                                <TableCell>
                                    <Link
                                        href={`https://app.pulumi.com/${orgName}/${deployment.projectName}/${deployment.stackName}/deployments/${deployment.version}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        {deployment.projectName}/{deployment.stackName}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={deployment.status}
                                        size="small"
                                        className={classes.statusChip}
                                        style={{
                                            backgroundColor: getStatusColor(deployment.status),
                                            color: '#ffffff',
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box className={classes.userCell}>
                                        {deployment.requestedBy?.avatarUrl && (
                                            <Avatar
                                                src={deployment.requestedBy.avatarUrl}
                                                alt={deployment.requestedBy.name}
                                                className={classes.avatar}
                                            />
                                        )}
                                        <Typography variant="body2">
                                            {deployment.requestedBy?.name || deployment.requestedBy?.githubLogin || '-'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell className={classes.timestamp}>
                                    {formatTimestamp(deployment.created)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </InfoCard>
    );
};

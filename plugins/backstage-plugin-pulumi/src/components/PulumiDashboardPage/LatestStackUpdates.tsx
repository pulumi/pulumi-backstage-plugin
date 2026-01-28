import {
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
import { UserStack } from '../../api/types';
import { tableRowAlternate } from '../../styles';

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
}));

type LatestStackUpdatesProps = {
    stacks: UserStack[];
    orgName: string;
};

const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const LatestStackUpdates = ({ stacks, orgName }: LatestStackUpdatesProps) => {
    const classes = useStyles();

    const filteredStacks = stacks
        .filter(s => s.orgName === orgName)
        .slice(0, 10);

    return (
        <InfoCard title="Latest Stack Updates">
            {filteredStacks.length === 0 ? (
                <Typography className={classes.noData}>
                    No recent stack updates
                </Typography>
            ) : (
                <Table size="small" className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell className={classes.headerCell}>Project / Stack</TableCell>
                            <TableCell className={classes.headerCell}>Resources</TableCell>
                            <TableCell className={classes.headerCell}>Last Update</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredStacks.map((stack, index) => (
                            <TableRow
                                key={`${stack.orgName}/${stack.projectName}/${stack.stackName}`}
                                style={{ backgroundColor: index % 2 === 1 ? tableRowAlternate : 'transparent' }}
                            >
                                <TableCell>
                                    <Link
                                        href={`https://app.pulumi.com/${stack.orgName}/${stack.projectName}/${stack.stackName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.link}
                                    >
                                        {stack.projectName}/{stack.stackName}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {stack.resourceCount !== undefined ? stack.resourceCount : '-'}
                                </TableCell>
                                <TableCell className={classes.timestamp}>
                                    {formatTimestamp(stack.lastUpdate)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </InfoCard>
    );
};

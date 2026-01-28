import { ReactNode } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    makeStyles,
} from '@material-ui/core';
import PeopleIcon from '@material-ui/icons/People';
import LayersIcon from '@material-ui/icons/Layers';
import CloudIcon from '@material-ui/icons/Cloud';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { pulumiColors } from '../../styles';

const useStyles = makeStyles(theme => ({
    card: {
        backgroundColor: theme.palette.type === 'dark' ? '#1e1e2f' : '#f5f5f7',
        borderRadius: theme.spacing(1.5),
        height: '100%',
    },
    cardContent: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        padding: theme.spacing(3),
        '&:last-child': {
            paddingBottom: theme.spacing(3),
        },
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        borderRadius: theme.spacing(1),
        backgroundColor: pulumiColors.violet,
    },
    icon: {
        fontSize: 32,
        color: '#ffffff',
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    value: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.2,
    },
    label: {
        color: theme.palette.text.secondary,
        fontWeight: 500,
    },
}));

type StatCardProps = {
    icon: ReactNode;
    value: number | string;
    label: string;
};

const StatCard = ({ icon, value, label }: StatCardProps) => {
    const classes = useStyles();

    return (
        <Card className={classes.card} elevation={0}>
            <CardContent className={classes.cardContent}>
                <Box className={classes.iconContainer}>
                    {icon}
                </Box>
                <Box className={classes.textContainer}>
                    <Typography className={classes.value}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </Typography>
                    <Typography variant="body2" className={classes.label}>
                        {label}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

type StatsCardsProps = {
    memberCount: number;
    stackCount: number;
    environmentCount: number;
    resourceCount: number;
};

export const StatsCards = ({ memberCount, stackCount, environmentCount, resourceCount }: StatsCardsProps) => {
    const classes = useStyles();

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<PeopleIcon className={classes.icon} />}
                    value={memberCount}
                    label="Members"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<LayersIcon className={classes.icon} />}
                    value={stackCount}
                    label="Stacks"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<VpnKeyIcon className={classes.icon} />}
                    value={environmentCount}
                    label="Environments"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={<CloudIcon className={classes.icon} />}
                    value={resourceCount}
                    label="Resources"
                />
            </Grid>
        </Grid>
    );
};

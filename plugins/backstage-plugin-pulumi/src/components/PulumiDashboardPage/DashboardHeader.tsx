import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Select,
    Typography,
    makeStyles,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { PulumiIcon } from '../PulumiIcon';
import { UserOrganization } from '../../api/types';

// Helper to get the org slug (URL-safe identifier) for API calls
const getOrgSlug = (org: UserOrganization): string => {
    return org.login || org.githubLogin || org.name;
};

// Helper to get the display name for an organization
const getOrgDisplayName = (org: UserOrganization): string => {
    return org.name;
};

const useStyles = makeStyles(theme => ({
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing(3),
        flexWrap: 'wrap',
        gap: theme.spacing(2),
    },
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
    },
    title: {
        fontWeight: 600,
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
    },
    orgSelect: {
        minWidth: 200,
    },
    button: {
        textTransform: 'none',
    },
}));

type DashboardHeaderProps = {
    organizations: UserOrganization[];
    selectedOrg: string;
    onOrgChange: (org: string) => void;
};

export const DashboardHeader = ({
    organizations,
    selectedOrg,
    onOrgChange,
}: DashboardHeaderProps) => {
    const classes = useStyles();

    return (
        <Box className={classes.header}>
            <Box className={classes.titleSection}>
                <PulumiIcon style={{ fontSize: 48 }} />
                <Typography variant="h4" className={classes.title}>
                    Pulumi Dashboard
                </Typography>
            </Box>
            <Box className={classes.controls}>
                <FormControl variant="outlined" size="small" className={classes.orgSelect}>
                    <Select
                        value={selectedOrg}
                        onChange={(e) => onOrgChange(e.target.value as string)}
                    >
                        {organizations.map((org) => (
                            <MenuItem key={getOrgSlug(org)} value={getOrgSlug(org)}>
                                {getOrgDisplayName(org)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    className={classes.button}
                    href={`https://app.pulumi.com/${selectedOrg}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Create project
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    className={classes.button}
                    href={`https://app.pulumi.com/${selectedOrg}/deployments`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Browse deployments
                </Button>
            </Box>
        </Box>
    );
};

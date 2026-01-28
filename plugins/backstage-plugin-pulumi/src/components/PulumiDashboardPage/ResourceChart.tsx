import { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Select,
    makeStyles,
} from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import { InfoCard, Progress } from '@backstage/core-components';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { ResourceSummaryPoint } from '../../api/types';
import { pulumiColors } from '../../styles';

const useStyles = makeStyles(theme => ({
    chartContainer: {
        width: '100%',
        height: 300,
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    timeRangeSelect: {
        minWidth: 140,
    },
    downloadButton: {
        textTransform: 'none',
    },
    noData: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        color: theme.palette.text.secondary,
    },
}));

type TimeRange = 'week' | 'month' | 'year';

type ResourceChartProps = {
    data: ResourceSummaryPoint[];
    loading: boolean;
    onTimeRangeChange: (granularity: string, lookbackDays: number) => void;
};

const formatDate = (point: ResourceSummaryPoint): string => {
    const { year, month, day } = point;
    if (day && month) {
        return `${month}/${day}`;
    }
    if (month) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[month - 1] || String(month);
    }
    return String(year);
};

const transformData = (data: ResourceSummaryPoint[]) => {
    return data.map(point => ({
        date: formatDate(point),
        count: point.resources,
        ...point,
    }));
};

const formatDateForCSV = (point: ResourceSummaryPoint): string => {
    if (point.day && point.month) {
        return `${point.year}-${String(point.month).padStart(2, '0')}-${String(point.day).padStart(2, '0')}`;
    }
    if (point.month) {
        return `${point.year}-${String(point.month).padStart(2, '0')}`;
    }
    return String(point.year);
};

const downloadCSV = (data: ResourceSummaryPoint[]) => {
    const headers = ['Date', 'Resources'];
    const rows = data.map(point => {
        const date = formatDateForCSV(point);
        return `${date},${point.resources}`;
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resource-history.csv';
    link.click();
    URL.revokeObjectURL(url);
};

export const ResourceChart = ({ data, loading, onTimeRangeChange }: ResourceChartProps) => {
    const classes = useStyles();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const handleTimeRangeChange = (newRange: TimeRange) => {
        setTimeRange(newRange);
        switch (newRange) {
            case 'week':
                onTimeRangeChange('daily', 7);
                break;
            case 'month':
                onTimeRangeChange('daily', 30);
                break;
            case 'year':
                onTimeRangeChange('monthly', 365);
                break;
            default:
                onTimeRangeChange('daily', 30);
        }
    };

    const chartData = transformData(data);

    return (
        <InfoCard title="Resource Count Over Time">
            <Box className={classes.controls}>
                <FormControl variant="outlined" size="small" className={classes.timeRangeSelect}>
                    <Select
                        value={timeRange}
                        onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
                    >
                        <MenuItem value="week">Last week</MenuItem>
                        <MenuItem value="month">Last month</MenuItem>
                        <MenuItem value="year">Last year</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GetAppIcon />}
                    className={classes.downloadButton}
                    onClick={() => downloadCSV(data)}
                    disabled={data.length === 0}
                >
                    Download CSV
                </Button>
            </Box>
            {loading && (
                <Box className={classes.chartContainer}>
                    <Progress />
                </Box>
            )}
            {!loading && chartData.length === 0 && (
                <Box className={classes.noData}>
                    No resource history data available
                </Box>
            )}
            {!loading && chartData.length > 0 && (
                <Box className={classes.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorResources" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={pulumiColors.violet} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={pulumiColors.violet} stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 4,
                                }}
                                labelStyle={{ fontWeight: 600 }}
                                formatter={(value: number) => [value.toLocaleString(), 'Resources']}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={pulumiColors.violet}
                                strokeWidth={2}
                                fill="url(#colorResources)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </InfoCard>
    );
};

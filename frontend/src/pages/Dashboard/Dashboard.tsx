import * as React from 'react';
import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { 
  Card, 
  CardContent, 
  Grid, 
  Box, 
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  Warning,
  AttachMoney,
  Category,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Refresh,
  MoreVert,
  Circle,
  Download as DownloadIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import { dashboardService, DashboardData, DashboardKPIs, Item, exportService } from '../../api/funcs';

// Low stock threshold
const LOW_STOCK_THRESHOLD = 10; //later make this dynamic

// KPI Card Component
const KPICard = ({ title, value, icon, change, trend, format = 'number' }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency';
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(2)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(2)}K`;
      }
      return `$${val.toLocaleString()}`;
    }
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'success.main';
      case 'down': return 'error.main';
      default: return 'text.secondary';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'down': return <TrendingDown sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
              {formatValue(value)}
            </Typography>
            {change !== 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  color={getTrendColor()}
                  sx={{ fontSize: 14 }}
                >
                  {getTrendIcon()}
                  <Typography variant="body2" color="inherit" sx={{ ml: 0.5 }}>
                    {Math.abs(change)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// Chart Placeholder Component
const ChartPlaceholder = ({ title, height = 300 }: { title: string; height?: number }) => (
  <Paper elevation={2} sx={{ p: 3, height }}>
    <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      <IconButton size="small">
        <MoreVert />
      </IconButton>
    </Box>
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      height="calc(100% - 60px)"
      bgcolor="grey.50"
      borderRadius={1}
      flexDirection="column"
      gap={2}
    >
      <Assessment sx={{ fontSize: 48, color: 'grey.400' }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Chart visualization will be implemented here<br/>
        <em>({title})</em>
      </Typography>
    </Box>
  </Paper>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kpiData, setKpiData] = useState<DashboardKPIs | null>(null);
  const [topProducts, setTopProducts] = useState<Item[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; item: string; time: string; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data using the centralized service
      const [
        dashData,
        kpiData,
        topProductsData,
        recentActivityData
      ] = await Promise.all([
        dashboardService.getDashboardData(LOW_STOCK_THRESHOLD),
        dashboardService.getDashboardKPIs(LOW_STOCK_THRESHOLD),
        dashboardService.getTopProductsByValue(5),
        Promise.resolve(dashboardService.getRecentActivity())
      ]);

      setDashboardData(dashData);
      setKpiData(kpiData);
      setTopProducts(topProductsData);
      setRecentActivity(recentActivityData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExportLowStock = async () => {
    try {
      const blob = await exportService.exportItemsToExcel({ lowStockOnly: true });
      exportService.downloadBlob(blob, `estoque_baixo_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting low stock items:', err);
    }
  };

  const handleExportFullReport = async () => {
    try {
      const blob = await exportService.exportFullReport();
      exportService.downloadBlob(blob, `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting full report:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Analytics Dashboard" currentPage="DashBoard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout pageTitle="Analytics Dashboard" currentPage="DashBoard">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box display="flex" justifyContent="center">
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Box>
      </AppLayout>
    );
  }

  if (!dashboardData || !kpiData) {
    return (
      <AppLayout pageTitle="Analytics Dashboard" currentPage="DashBoard">
        <Alert severity="warning">No data available</Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Analytics Dashboard" currentPage="DashBoard">
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Inventory Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights and analytics for your stock management
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Exportar Estoque Baixo">
            <IconButton color="warning" onClick={handleExportLowStock}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar Relatório Completo">
            <IconButton color="success" onClick={handleExportFullReport}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
          <IconButton color="primary" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
          <Chip 
            label={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            size="small" 
            variant="outlined" 
            color="success"
          />
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Products"
            value={kpiData.totalProducts.value}
            icon={<Inventory />}
            change={kpiData.totalProducts.change}
            trend={kpiData.totalProducts.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Low Stock Items"
            value={kpiData.lowStockItems.value}
            icon={<Warning />}
            change={kpiData.lowStockItems.change}
            trend={kpiData.lowStockItems.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Value"
            value={kpiData.totalValue.value}
            icon={<AttachMoney />}
            change={kpiData.totalValue.change}
            trend={kpiData.totalValue.trend}
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Categories"
            value={kpiData.categories.value}
            icon={<Category />}
            change={kpiData.categories.change}
            trend={kpiData.categories.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Monthly Orders"
            value={kpiData.monthlyOrders.value}
            icon={<ShoppingCart />}
            change={kpiData.monthlyOrders.change}
            trend={kpiData.monthlyOrders.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Reorder Points"
            value={kpiData.reorderPoints.value}
            icon={<LocalShipping />}
            change={kpiData.reorderPoints.change}
            trend={kpiData.reorderPoints.trend}
          />
        </Grid>
      </Grid>

      {/* Main Analytics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <ChartPlaceholder title="Sales & Inventory Trends" height={400} />
        </Grid>
        
        {/* Stock Distribution */}
        <Grid item xs={12} lg={4}>
          <ChartPlaceholder title="Stock Distribution by Category" height={400} />
        </Grid>
      </Grid>

      {/* Secondary Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <ChartPlaceholder title="Top Selling Products" height={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartPlaceholder title="Revenue by Month" height={300} />
        </Grid>
      </Grid>

      {/* Data Tables and Lists */}
      <Grid container spacing={3}>
        {/* Top Products by Value */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Top Products by Value
            </Typography>
            <List>
              {topProducts.map((product: Item, index: number) => (
                <React.Fragment key={product.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.name || product.title}
                      secondary={
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            Stock: {product.stock}
                          </Typography>
                          <Typography variant="caption">
                            Price: ${(product.sell_price || product.purchase_price || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Value: ${((product.sell_price || product.purchase_price || 0) * product.stock).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            {topProducts.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No products available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Stock Alerts */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Stock Alerts
            </Typography>
            <List>
              {dashboardData.lowStockItems.slice(0, 4).map((alert: Item, index: number) => {
                // Use the product's individual threshold, fallback to 10 if not set
                const threshold = alert.low_stock_threshold || 10;
                return (
                  <React.Fragment key={alert.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={alert.name || alert.title}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              Current: {alert.stock} | Threshold: {threshold}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min((alert.stock / threshold) * 100, 100)}
                                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                color={alert.stock <= threshold ? 'error' : 'warning'}
                              />
                              <Chip 
                                label={alert.category || 'No category'} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(dashboardData.lowStockItems.length - 1, 3) && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
            {dashboardData.lowStockItems.length === 0 && (
              <Typography variant="body2" color="success.main" textAlign="center">
                No low stock alerts! All products are well stocked.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity: any, index: number) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Circle 
                        sx={{ 
                          fontSize: 12,
                          color: activity.type === 'alert' ? 'error.main' : 
                                 activity.type === 'add' ? 'success.main' : 'info.main'
                        }} 
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {activity.item}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </AppLayout>
  );
} 
import * as React from 'react';
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
  ListItemAvatar
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
  Circle
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';

// Mock data - in real app this would come from API
const mockData = {
  kpis: {
    totalProducts: { value: 1247, change: 12.5, trend: 'up' as const },
    lowStockItems: { value: 23, change: -8.3, trend: 'down' as const },
    totalValue: { value: 485230, change: 18.2, trend: 'up' as const },
    categories: { value: 15, change: 0, trend: 'neutral' as const },
    monthlyOrders: { value: 892, change: 22.1, trend: 'up' as const },
    reorderPoints: { value: 45, change: 15.8, trend: 'up' as const }
  },
  topProducts: [
    { name: 'Wireless Headphones', stock: 85, sales: 156, value: 12450 },
    { name: 'Smartphone Cases', stock: 234, sales: 98, value: 8670 },
    { name: 'Laptop Stands', stock: 67, sales: 89, value: 7890 },
    { name: 'USB Cables', stock: 145, sales: 167, value: 5430 },
    { name: 'Bluetooth Speakers', stock: 78, sales: 134, value: 9870 }
  ],
  stockAlerts: [
    { product: 'iPhone 15 Pro Cases', current: 12, minimum: 50, category: 'Electronics' },
    { product: 'Gaming Keyboards', current: 8, minimum: 25, category: 'Gaming' },
    { product: 'Wireless Mice', current: 15, minimum: 40, category: 'Computer' },
    { product: 'Monitor Stands', current: 6, minimum: 20, category: 'Accessories' }
  ],
  recentActivity: [
    { action: 'Stock Update', item: 'MacBook Pro M3', time: '5 min ago', type: 'update' },
    { action: 'New Product', item: 'AirPods Pro 3', time: '1 hour ago', type: 'add' },
    { action: 'Low Stock Alert', item: 'Samsung Galaxy S24', time: '2 hours ago', type: 'alert' },
    { action: 'Category Created', item: 'Smart Home', time: '3 hours ago', type: 'category' }
  ]
};

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
      return `$${val.toLocaleString()}`;
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
          <IconButton color="primary">
            <Refresh />
          </IconButton>
          <Chip 
            label="Last updated: 2 min ago" 
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
            value={mockData.kpis.totalProducts.value}
            icon={<Inventory />}
            change={mockData.kpis.totalProducts.change}
            trend={mockData.kpis.totalProducts.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Low Stock Items"
            value={mockData.kpis.lowStockItems.value}
            icon={<Warning />}
            change={mockData.kpis.lowStockItems.change}
            trend={mockData.kpis.lowStockItems.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Total Value"
            value={mockData.kpis.totalValue.value}
            icon={<AttachMoney />}
            change={mockData.kpis.totalValue.change}
            trend={mockData.kpis.totalValue.trend}
            format="currency"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Categories"
            value={mockData.kpis.categories.value}
            icon={<Category />}
            change={mockData.kpis.categories.change}
            trend={mockData.kpis.categories.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Monthly Orders"
            value={mockData.kpis.monthlyOrders.value}
            icon={<ShoppingCart />}
            change={mockData.kpis.monthlyOrders.change}
            trend={mockData.kpis.monthlyOrders.trend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Reorder Points"
            value={mockData.kpis.reorderPoints.value}
            icon={<LocalShipping />}
            change={mockData.kpis.reorderPoints.change}
            trend={mockData.kpis.reorderPoints.trend}
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
        {/* Top Products */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Top Performing Products
            </Typography>
            <List>
              {mockData.topProducts.map((product, index) => (
                <React.Fragment key={product.name}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.name}
                      secondary={
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            Stock: {product.stock}
                          </Typography>
                          <Typography variant="caption">
                            Sales: {product.sales}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            ${product.value.toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < mockData.topProducts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Stock Alerts */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Stock Alerts
            </Typography>
            <List>
              {mockData.stockAlerts.map((alert, index) => (
                <React.Fragment key={alert.product}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                        <Warning />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.product}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            Current: {alert.current} | Min: {alert.minimum}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(alert.current / alert.minimum) * 100}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                              color={alert.current < alert.minimum ? 'error' : 'warning'}
                            />
                            <Chip 
                              label={alert.category} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < mockData.stockAlerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <List>
              {mockData.recentActivity.map((activity, index) => (
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
                  {index < mockData.recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </AppLayout>
  );
} 
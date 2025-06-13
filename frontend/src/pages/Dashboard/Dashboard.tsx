import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Card, CardContent, Grid, Box } from '@mui/material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';

export default function Dashboard() {
  return (
    <AppLayout pageTitle="Dashboard" currentPage="DashBoard">
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 600 }}>
        Dashboard
      </Typography>
      
      <Typography variant="body1" sx={{ marginBottom: 3 }}>
        Welcome to the dashboard. Here you can view your analytics and key metrics.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4" color="primary">
                42
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning.main">
                8
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4" color="success.main">
                $12,450
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>
              <Typography variant="h4" color="info.main">
                15
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  • Product "Widget A" stock updated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • New product "Gadget B" added
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Category "Electronics" created
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppLayout>
  );
} 
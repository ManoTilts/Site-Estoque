import Typography from '@mui/material/Typography';
import { Card, CardContent, Avatar, Chip, Grid, Paper, Box, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';

export default function Profile() {
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppLayout pageTitle="Profile" currentPage="Profile">
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 600 }}>
        Account Information
      </Typography>
      
      {user ? (
        <Grid container spacing={3}>
          {/* Main Profile Card */}
          <Grid item xs={12} md={8}>
            <Card elevation={3} sx={{ p: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: 3,
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      fontWeight: 600
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {user.username}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {user.email}
                    </Typography>
                    <Chip 
                      label={user.is_active ? "Active" : "Inactive"} 
                      color={user.is_active ? "success" : "error"}
                      size="small"
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        User ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {user.id}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Account Status
                      </Typography>
                      <Typography variant="body1">
                        {user.is_active ? "Active Account" : "Inactive Account"}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Member Since
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(user.created_at)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ p: 3, height: 'fit-content' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Quick Stats
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Standard User
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Login Status
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Currently Logged In
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Activity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Today
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No user information available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please log in to view your profile information.
          </Typography>
        </Card>
      )}
    </AppLayout>
  );
}

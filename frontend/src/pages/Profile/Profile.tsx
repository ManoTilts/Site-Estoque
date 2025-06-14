import Typography from '@mui/material/Typography';
import { 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid, 
  Paper, 
  Box, 
  Divider, 
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Tooltip,
  Fade,
  Stack
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Security as SecurityIcon, 
  PhotoCamera as PhotoCameraIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';

export default function Profile() {
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let ageText = '';
    if (diffDays < 30) ageText = `${diffDays} days ago`;
    else if (diffDays < 365) ageText = `${Math.floor(diffDays / 30)} months ago`;
    else ageText = `${Math.floor(diffDays / 365)} years ago`;
    
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} (${ageText})`;
  };

  const handleEditProfile = () => {
    setEditData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setEditDialogOpen(false);
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
  };

  const getAccountAge = () => {
    if (!user?.created_at) return 'Unknown';
    const created = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const ProfileSkeleton = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card elevation={3} sx={{ p: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="circular" width={80} height={80} sx={{ mr: 3 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="rectangular" width={80} height={24} sx={{ mt: 1, borderRadius: 12 }} />
              </Box>
            </Box>
            <Skeleton variant="rectangular" height={200} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={250} />
      </Grid>
    </Grid>
  );

  return (
    <AppLayout pageTitle="Profile" currentPage="Profile">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
        My Profile
      </Typography>

      {updateSuccess && (
        <Fade in={updateSuccess}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        </Fade>
      )}
      
      {!user ? (
        <ProfileSkeleton />
      ) : (
        <Grid container spacing={3}>
          {/* Main Profile Card */}
          <Grid item xs={12} md={8}>
            <Card elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                        width: 100,
                        height: 100,
                      mr: 3,
                      bgcolor: 'primary.main',
                        fontSize: '2.5rem',
                        fontWeight: 600,
                        boxShadow: 3
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                    <Tooltip title="Change Profile Picture">
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: -8,
                          right: 8,
                          bgcolor: 'background.paper',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'grey.100' }
                        }}
                        size="small"
                      >
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                                    <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {user.username}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                      <Typography variant="body1" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                    <Chip 
                      label={user.is_active ? "Active" : "Inactive"} 
                      color={user.is_active ? "success" : "error"}
                        size="medium"
                        icon={user.is_active ? <AccountCircleIcon /> : <ShieldIcon />}
                      />
                      <Chip 
                        label="Standard User" 
                        color="primary"
                        variant="outlined"
                        size="medium"
                        icon={<PersonIcon />}
                      />
                    </Stack>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                  Account Details
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" color="primary.main" fontWeight={600}>
                        User ID
                      </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9rem' }}>
                        {user.id}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ShieldIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="subtitle1" color="success.main" fontWeight={600}>
                        Account Status
                      </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {user.is_active ? "Active Account" : "Inactive Account"}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="subtitle1" color="info.main" fontWeight={600}>
                        Member Since
                      </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(user.created_at)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Quick Actions Card */}
              <Card elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                    Quick Actions
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={handleEditProfile}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SecurityIcon />}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Security Settings
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PhotoCameraIcon />}
                      sx={{ borderRadius: 2, py: 1.5 }}
                    >
                      Change Avatar
                    </Button>
                  </Stack>
              </CardContent>
            </Card>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Edit Profile
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={editData.username}
              onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile}
            variant="contained"
            disabled={isLoading}
            sx={{ borderRadius: 2, minWidth: 100 }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}

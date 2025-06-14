import Typography from '@mui/material/Typography';
import { 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid, 
  Box, 
  Divider, 
  Button,
  IconButton,
  TextField,
  Alert,
  Skeleton,
  Tooltip,
  Fade,
  Stack,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Switch,
  FormControlLabel,
  Paper
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Security as SecurityIcon, 
  PhotoCamera as PhotoCameraIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  VerifiedUser as VerifiedUserIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Shield as ShieldIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Fingerprint as FingerprintIcon,
  VpnKey as VpnKeyIcon,
  Notifications as NotificationsIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import { styled } from '@mui/material/styles';

// --- Types ---
type ViewMode = 'profile' | 'edit' | 'security';

// --- Styled Components ---
interface StyledBadgeProps {
  isactive: boolean;
}

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'isactive',
})<StyledBadgeProps>(({ theme, isactive }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: isactive ? '#44b700' : '#f44336',
    color: isactive ? '#44b700' : '#f44336',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  overflow: 'visible',
}));

// --- Main Component ---
export default function Profile() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('profile');
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true,
    sessionTimeout: 30
  });
  const [isLoading, setIsLoading] = useState(!user);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [user]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewChange = (view: ViewMode) => {
    if (view === 'edit') {
    setEditData({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    }
    setCurrentView(view);
  };

  const validatePassword = () => {
    if (editData.newPassword && editData.newPassword !== editData.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return false;
    }
    if (editData.newPassword && editData.newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (editData.newPassword && !editData.currentPassword) {
      setPasswordError('Digite sua senha atual para alterar a senha');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Aqui você atualizaria o usuário no seu context
    console.log("Saving data:", {
      username: editData.username,
      email: editData.email,
      changePassword: !!editData.newPassword
    });
    setIsLoading(false);
    setCurrentView('profile');
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 4000);
  };

  const handleSecuritySettingChange = (setting: keyof typeof securitySettings, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // --- View Components ---
  const ProfileView = () => (
                <Box sx={{ p: { xs: 2, md: 4 }, mt: -10 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-end">
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
          isactive={user?.is_active ?? false}
                    >
                      <Avatar
                        sx={{
                          width: 140,
                          height: 140,
                          bgcolor: 'primary.main',
                          fontSize: '4rem',
                          fontWeight: 600,
                          border: '4px solid white'
                        }}
                      >
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                       <Tooltip title="Alterar foto de perfil">
                          <IconButton
                            sx={{
                              position: 'absolute',
                              bottom: 10,
                              right: 10,
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { bgcolor: 'white' }
                            }}
                          >
                            <PhotoCameraIcon />
                          </IconButton>
                       </Tooltip>
                    </StyledBadge>

                    <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left'} }}>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {user?.username || 'Usuário'}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', justifyContent: { xs: 'center', md: 'flex-start'} }}>
                        <EmailIcon fontSize="small" />
            <Typography variant="body1">{user?.email || 'email@exemplo.com'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: { xs: 'center', md: 'flex-start'} }}>
                         <Chip 
              label={user?.is_active ? "Verificado" : "Pendente"} 
              color={user?.is_active ? "success" : "warning"}
                           size="small"
                           icon={<VerifiedUserIcon />}
                           variant="filled"
                         />
                         <Chip 
                           label="Usuário Padrão" 
                           color="primary"
                           variant="outlined"
                           size="small"
                           icon={<PersonIcon />}
                         />
                      </Stack>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 4 }}>Detalhes da Conta</Divider>

                  <Grid container spacing={3}>
                     <Grid item xs={12} sm={6}>
                        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                           <ListItemIcon sx={{ minWidth: 40 }}><CalendarIcon color="action"/></ListItemIcon>
            <ListItemText primary="Membro desde" secondary={formatDate(user?.created_at)} />
                        </Card>
                     </Grid>
                     <Grid item xs={12} sm={6}>
                        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                           <ListItemIcon sx={{ minWidth: 40 }}><SecurityIcon color="action"/></ListItemIcon>
                           <ListItemText primary="Tipo de Acesso" secondary="Autenticação 2 Fatores Ativa" />
                        </Card>
                     </Grid>
                  </Grid>
                </Box>
  );

  const EditView = () => (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Editar Perfil
                      </Typography>
        <IconButton onClick={() => setCurrentView('profile')} sx={{ bgcolor: 'action.hover' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nome de Usuário"
              value={editData.username}
              onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Endereço de E-mail"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
            />
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Alterar Senha (Opcional)
              </Typography>
            </Divider>
            
            <TextField
              fullWidth
              label="Senha Atual"
              type="password"
              value={editData.currentPassword}
              onChange={(e) => setEditData(prev => ({ ...prev, currentPassword: e.target.value }))}
              helperText="Necessário apenas se você quiser alterar a senha"
            />
            <TextField
              fullWidth
              label="Nova Senha"
              type="password"
              value={editData.newPassword}
              onChange={(e) => setEditData(prev => ({ ...prev, newPassword: e.target.value }))}
              helperText="Deixe em branco se não quiser alterar"
            />
            <TextField
              fullWidth
              label="Confirmar Nova Senha"
              type="password"
              value={editData.confirmPassword}
              onChange={(e) => setEditData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={!!passwordError}
              helperText={passwordError || "Confirme a nova senha"}
            />

        <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
          <Button 
            onClick={handleSaveProfile}
            variant="contained"
            disabled={isLoading}
            startIcon={<SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button 
            onClick={() => setCurrentView('profile')}
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );

  const SecurityView = () => (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Configurações de Segurança
        </Typography>
        <IconButton onClick={() => setCurrentView('profile')} sx={{ bgcolor: 'action.hover' }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Stack spacing={3}>
        {/* Two-Factor Authentication */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <ShieldIcon color="primary" />
            <Typography variant="h6">Autenticação de Dois Fatores</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adicione uma camada extra de segurança à sua conta
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) => handleSecuritySettingChange('twoFactorEnabled', e.target.checked)}
              />
            }
            label={securitySettings.twoFactorEnabled ? "Ativado" : "Desativado"}
          />
          {!securitySettings.twoFactorEnabled && (
            <Button variant="outlined" startIcon={<PhoneAndroidIcon />} sx={{ mt: 2 }}>
              Configurar 2FA
            </Button>
          )}
        </Paper>

        {/* Login Notifications */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">Notificações de Login</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Receba alertas sobre atividades suspeitas em sua conta
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.emailNotifications}
                  onChange={(e) => handleSecuritySettingChange('emailNotifications', e.target.checked)}
                />
              }
              label="Notificações por Email"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.smsNotifications}
                  onChange={(e) => handleSecuritySettingChange('smsNotifications', e.target.checked)}
                />
              }
              label="Notificações por SMS"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={securitySettings.loginAlerts}
                  onChange={(e) => handleSecuritySettingChange('loginAlerts', e.target.checked)}
                />
              }
              label="Alertas de Login Suspeito"
            />
          </Stack>
        </Paper>

        {/* Session Management */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <LockIcon color="primary" />
            <Typography variant="h6">Gerenciamento de Sessão</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure o tempo limite de inatividade da sessão
          </Typography>
          <TextField
            type="number"
            label="Tempo limite (minutos)"
            value={securitySettings.sessionTimeout}
            onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
            sx={{ width: 200 }}
            inputProps={{ min: 5, max: 480 }}
          />
        </Paper>

        {/* Password Security */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <VpnKeyIcon color="primary" />
            <Typography variant="h6">Segurança da Senha</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Última alteração: {formatDate(user?.created_at)}
          </Typography>
          <Button variant="outlined" onClick={() => setCurrentView('edit')}>
            Alterar Senha
          </Button>
        </Paper>

        {/* Biometric Authentication */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <FingerprintIcon color="primary" />
            <Typography variant="h6">Autenticação Biométrica</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use impressão digital ou reconhecimento facial (Em breve)
          </Typography>
          <Button variant="outlined" disabled>
            Configurar Biometria
          </Button>
        </Paper>
      </Stack>
    </Box>
  );

  const ProfileSkeleton = () => (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <ProfileCard>
          <Skeleton variant="rectangular" height={180} />
          <Box sx={{ p: 4, mt: -10 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <Skeleton variant="circular" width={140} height={140} />
              <Box sx={{ flexGrow: 1, mb: 2 }}>
                <Skeleton variant="text" width="60%" height={48} />
                <Skeleton variant="text" width="40%" height={24} />
              </Box>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }}/>
            <Skeleton variant="rectangular" height={80} />
          </Box>
        </ProfileCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <ProfileCard sx={{ p: 2 }}>
            <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2, ml: 2 }} />
            <Skeleton variant="rectangular" height={150} />
        </ProfileCard>
      </Grid>
    </Grid>
  );

  return (
    <AppLayout pageTitle="Meu Perfil" currentPage="Perfil">
      {updateSuccess && (
        <Fade in={updateSuccess}>
          <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
            Perfil atualizado com sucesso!
          </Alert>
        </Fade>
      )}
      
      {isLoading || !user ? (
        <ProfileSkeleton />
      ) : (
        <Fade in={!isLoading} timeout={800}>
          <Grid container spacing={4}>
            {/* Main Content */}
            <Grid item xs={12} lg={8}>
              <ProfileCard>
                {currentView !== 'profile' && (
                  <Box sx={{
                    height: 60,
                    background: 'linear-gradient(45deg, #FF8E53 30%, #FFD54F 90%)',
                  }} />
                )}
                {currentView === 'profile' && (
                  <Box sx={{
                    height: 180,
                    background: 'linear-gradient(45deg, #FF8E53 30%, #FFD54F 90%)',
                  }} />
                )}
                
                {currentView === 'profile' && <ProfileView />}
                {currentView === 'edit' && <EditView />}
                {currentView === 'security' && <SecurityView />}
              </ProfileCard>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={4}>
                <ProfileCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Ações Rápidas
                    </Typography>
                    <List disablePadding>
                      <ListItem disablePadding>
                        <ListItemButton 
                          onClick={() => handleViewChange('edit')} 
                          sx={{ borderRadius: 2 }}
                          selected={currentView === 'edit'}
                        >
                          <ListItemIcon><EditIcon /></ListItemIcon>
                          <ListItemText primary="Editar Perfil" />
                          <ChevronRightIcon color="action" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton 
                          onClick={() => handleViewChange('security')} 
                          sx={{ borderRadius: 2 }}
                          selected={currentView === 'security'}
                        >
                          <ListItemIcon><SecurityIcon /></ListItemIcon>
                          <ListItemText primary="Segurança da Conta" />
                          <ChevronRightIcon color="action" />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton sx={{ borderRadius: 2 }}>
                          <ListItemIcon><PhotoCameraIcon /></ListItemIcon>
                          <ListItemText primary="Preferências de Avatar" />
                          <ChevronRightIcon color="action" />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </CardContent>
                </ProfileCard>
              </Stack>
            </Grid>
          </Grid>
        </Fade>
      )}
    </AppLayout>
  );
}
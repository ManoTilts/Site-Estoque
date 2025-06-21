import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransactionIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import axiosInstance from '../../api/axiosconfig';

interface ActivityLogItem {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: any;
  created_at: string;
}

interface ActivityStats {
  [key: string]: number;
  total: number;
}

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [stats, setStats] = useState<ActivityStats>({ total: 0 });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: (page * rowsPerPage).toString(),
        limit: rowsPerPage.toString(),
      });

      if (filterType) params.append('activity_type', filterType);
      if (filterEntity) params.append('entity_type', filterEntity);

      const [activitiesResponse, countResponse, statsResponse] = await Promise.all([
        axiosInstance.get(`/api/activity-logs/?${params.toString()}`),
        axiosInstance.get(`/api/activity-logs/count?${params.toString()}`),
        axiosInstance.get('/api/activity-logs/stats')
      ]);

      setActivities(activitiesResponse.data);
      setTotalCount(countResponse.data.count);
      setStats(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao carregar histórico de atividades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, rowsPerPage, filterType, filterEntity]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'item_created':
        return <AddIcon color="success" />;
      case 'item_updated':
        return <EditIcon color="info" />;
      case 'item_deleted':
        return <DeleteIcon color="error" />;
      case 'stock_transaction':
        return <TransactionIcon color="warning" />;
      case 'user_login':
      case 'user_logout':
        return <PersonIcon color="primary" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getActivityChipColor = (activityType: string) => {
    switch (activityType) {
      case 'item_created':
        return 'success';
      case 'item_updated':
        return 'info';
      case 'item_deleted':
        return 'error';
      case 'stock_transaction':
        return 'warning';
      case 'user_login':
      case 'user_logout':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'item_created':
        return 'Produto Criado';
      case 'item_updated':
        return 'Produto Atualizado';
      case 'item_deleted':
        return 'Produto Deletado';
      case 'stock_transaction':
        return 'Transação de Estoque';
      case 'user_login':
        return 'Login';
      case 'user_logout':
        return 'Logout';
      default:
        return activityType;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  if (loading && activities.length === 0) {
    return (
      <AppLayout pageTitle="Histórico de Atividade" currentPage="Activity Log">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Histórico de Atividade" currentPage="Activity Log">
      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Atividades
                </Typography>
                <Typography variant="h4">
                  {stats.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Produtos Criados
                </Typography>
                <Typography variant="h4">
                  {stats.item_created || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Transações de Estoque
                </Typography>
                <Typography variant="h4">
                  {stats.stock_transaction || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Produtos Atualizados
                </Typography>
                <Typography variant="h4">
                  {stats.item_updated || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Tipo</InputLabel>
              <Select
                value={filterType}
                label="Filtrar por Tipo"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="item_created">Produto Criado</MenuItem>
                <MenuItem value="item_updated">Produto Atualizado</MenuItem>
                <MenuItem value="item_deleted">Produto Deletado</MenuItem>
                <MenuItem value="stock_transaction">Transação de Estoque</MenuItem>
                <MenuItem value="user_login">Login</MenuItem>
                <MenuItem value="user_logout">Logout</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Entidade</InputLabel>
              <Select
                value={filterEntity}
                label="Filtrar por Entidade"
                onChange={(e) => setFilterEntity(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="item">Produto</MenuItem>
                <MenuItem value="stock_transaction">Transação</MenuItem>
                <MenuItem value="user">Usuário</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Activities Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Detalhes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getActivityIcon(activity.activity_type)}
                      <Chip
                        label={getActivityTypeLabel(activity.activity_type)}
                        color={getActivityChipColor(activity.activity_type) as any}
                        size="small"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>{formatDate(activity.created_at)}</TableCell>
                  <TableCell>
                    {activity.metadata && (
                      <Box>
                        {activity.metadata.item_title && (
                          <Typography variant="caption" display="block">
                            Produto: {activity.metadata.item_title}
                          </Typography>
                        )}
                        {activity.metadata.quantity && (
                          <Typography variant="caption" display="block">
                            Quantidade: {activity.metadata.quantity}
                          </Typography>
                        )}
                        {activity.metadata.transaction_type && (
                          <Typography variant="caption" display="block">
                            Tipo: {activity.metadata.transaction_type}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Atividades por página"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </TableContainer>
      </Box>
    </AppLayout>
  );
};

export default ActivityLog; 
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as TableChartIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  GetApp as GetAppIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import { exportService, productService } from '../../api/funcs';

interface ExportOptions {
  category: string;
  distributer: string;
  lowStockOnly: boolean;
  transactionType: string;
  activityType: string;
}

const ExportData: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [distributors, setDistributors] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  const [options, setOptions] = useState<ExportOptions>({
    category: '',
    distributer: '',
    lowStockOnly: false,
    transactionType: '',
    activityType: ''
  });

  // Load categories and distributors for filtering
  useEffect(() => {
    const loadData = async () => {
      setBackendStatus('checking');
      try {
        // Load data with fallback to empty arrays if backend is not responding
        const [categoriesData, distributorsData] = await Promise.allSettled([
          productService.getUserCategories(),
          productService.getUserDistributors()
        ]);
        
        // Check if at least one request succeeded
        const anySucceeded = categoriesData.status === 'fulfilled' || distributorsData.status === 'fulfilled';
        setBackendStatus(anySucceeded ? 'connected' : 'disconnected');
        
        // Handle categories
        if (categoriesData.status === 'fulfilled') {
          setCategories(categoriesData.value);
        } else {
          console.warn('Failed to load categories, using empty array');
          setCategories([]);
        }
        
        // Handle distributors
        if (distributorsData.status === 'fulfilled') {
          setDistributors(distributorsData.value);
        } else {
          console.warn('Failed to load distributors, using empty array');
          setDistributors([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setBackendStatus('disconnected');
        // Set empty arrays as fallback
        setCategories([]);
        setDistributors([]);
      }
    };
    loadData();
  }, []);

  const handleExport = async (exportType: string) => {
    if (backendStatus !== 'connected') {
      setError('Backend não está conectado. Inicie o servidor backend primeiro.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let blob: Blob;
      let filename: string;

      switch (exportType) {
        case 'items':
          blob = await exportService.exportItemsToExcel({
            category: options.category || undefined,
            distributer: options.distributer || undefined,
            lowStockOnly: options.lowStockOnly
          });
          filename = `produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
          
        case 'stock-transactions':
          blob = await exportService.exportStockTransactionsToExcel({
            transactionType: options.transactionType || undefined
          });
          filename = `transacoes_estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
          
        case 'activity-logs':
          blob = await exportService.exportActivityLogsToExcel({
            activityType: options.activityType || undefined
          });
          filename = `historico_atividades_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
          
        case 'full-report':
          blob = await exportService.exportFullReport();
          filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
          
        default:
          throw new Error('Tipo de exportação não suportado');
      }

      exportService.downloadBlob(blob, filename);
      setSuccess('Arquivo exportado com sucesso!');
      
    } catch (err: any) {
      console.error('Export error:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Timeout na conexão com o backend. Verifique se o servidor está rodando.');
      } else if (err.response?.status === 404) {
        setError('Endpoint de exportação não encontrado. Verifique se o backend foi atualizado.');
      } else if (err.response?.status >= 500) {
        setError('Erro interno do servidor. Verifique os logs do backend.');
      } else {
        setError(err.message || 'Erro ao exportar dados');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportItems = [
    {
      id: 'items',
      title: 'Produtos',
      description: 'Exportar lista completa de produtos com filtros opcionais',
      icon: <InventoryIcon />,
      color: 'primary'
    },
    {
      id: 'stock-transactions',
      title: 'Transações de Estoque',
      description: 'Exportar histórico de perdas, danos e devoluções',
      icon: <WarningIcon />,
      color: 'warning'
    },
    {
      id: 'activity-logs',
      title: 'Histórico de Atividades',
      description: 'Exportar log de todas as atividades do sistema',
      icon: <HistoryIcon />,
      color: 'info'
    },
    {
      id: 'full-report',
      title: 'Relatório Completo',
      description: 'Exportar relatório abrangente com múltiplas abas',
      icon: <AssessmentIcon />,
      color: 'success'
    }
  ];

  return (
    <AppLayout pageTitle="Exportar Dados" currentPage="Export Data">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Exportação de Dados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Exporte seus dados para Excel com opções de filtragem personalizadas
              </Typography>
            </Box>
            
            {/* Backend Status Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Backend:
              </Typography>
              {backendStatus === 'checking' && (
                <Chip 
                  label="Verificando..." 
                  size="small" 
                  color="default"
                  icon={<CircularProgress size={12} />}
                />
              )}
              {backendStatus === 'connected' && (
                <Chip 
                  label="Conectado" 
                  size="small" 
                  color="success"
                />
              )}
              {backendStatus === 'disconnected' && (
                <Chip 
                  label="Desconectado" 
                  size="small" 
                  color="error"
                />
              )}
            </Box>
          </Box>
          
          {/* Warning when backend is disconnected */}
          {backendStatus === 'disconnected' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Backend não conectado!</strong> 
              <br />
              Certifique-se de que o servidor backend está rodando em <code>http://localhost:8000</code>
              <br />
              Para iniciar o backend, execute: <code>cd backend && python -m uvicorn main:app --reload --port 8000</code>
            </Alert>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Export Options */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChartIcon />
                Opções de Filtro
              </Typography>

              <Stack spacing={3}>
                {/* Category Filter */}
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={options.category}
                    label="Categoria"
                    onChange={(e) => setOptions({ ...options, category: e.target.value })}
                  >
                    <MenuItem value="">Todas as categorias</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Distributor Filter */}
                <FormControl fullWidth>
                  <InputLabel>Fornecedor</InputLabel>
                  <Select
                    value={options.distributer}
                    label="Fornecedor"
                    onChange={(e) => setOptions({ ...options, distributer: e.target.value })}
                  >
                    <MenuItem value="">Todos os fornecedores</MenuItem>
                    {distributors.map((distributor) => (
                      <MenuItem key={distributor} value={distributor}>
                        {distributor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Low Stock Only */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.lowStockOnly}
                      onChange={(e) => setOptions({ ...options, lowStockOnly: e.target.checked })}
                    />
                  }
                  label="Apenas produtos com estoque baixo"
                />

                <Divider />

                {/* Transaction Type Filter */}
                <FormControl fullWidth>
                  <InputLabel>Tipo de Transação</InputLabel>
                  <Select
                    value={options.transactionType}
                    label="Tipo de Transação"
                    onChange={(e) => setOptions({ ...options, transactionType: e.target.value })}
                  >
                    <MenuItem value="">Todos os tipos</MenuItem>
                    <MenuItem value="loss">Perdas</MenuItem>
                    <MenuItem value="damage">Danos</MenuItem>
                    <MenuItem value="return">Devoluções</MenuItem>
                  </Select>
                </FormControl>

                {/* Activity Type Filter */}
                <FormControl fullWidth>
                  <InputLabel>Tipo de Atividade</InputLabel>
                  <Select
                    value={options.activityType}
                    label="Tipo de Atividade"
                    onChange={(e) => setOptions({ ...options, activityType: e.target.value })}
                  >
                    <MenuItem value="">Todos os tipos</MenuItem>
                    <MenuItem value="item_created">Item Criado</MenuItem>
                    <MenuItem value="item_updated">Item Atualizado</MenuItem>
                    <MenuItem value="item_deleted">Item Excluído</MenuItem>
                    <MenuItem value="stock_transaction">Transação de Estoque</MenuItem>
                    <MenuItem value="user_login">Login do Usuário</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          </Grid>

          {/* Export Options */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudDownloadIcon />
                Opções de Exportação
              </Typography>

              <List>
                {exportItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: `${item.color}.light`,
                            color: `${item.color}.main`
                          }}
                        >
                          {item.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={600}>
                            {item.title}
                          </Typography>
                        }
                        secondary={item.description}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title={backendStatus === 'disconnected' ? 'Backend desconectado' : `Exportar ${item.title}`}>
                          <IconButton
                            edge="end"
                            onClick={() => handleExport(item.id)}
                            disabled={loading || backendStatus !== 'connected'}
                            color={item.color as any}
                          >
                            {loading ? <CircularProgress size={24} /> : <GetAppIcon />}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < exportItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {/* Quick Export Buttons */}
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Exportações Rápidas:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<WarningIcon />}
                    onClick={() => {
                      setOptions({ ...options, lowStockOnly: true });
                      handleExport('items');
                    }}
                    disabled={loading || backendStatus !== 'connected'}
                  >
                    Estoque Baixo
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => handleExport('full-report')}
                    disabled={loading || backendStatus !== 'connected'}
                  >
                    Relatório Completo
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {(options.category || options.distributer || options.lowStockOnly || options.transactionType || options.activityType) && (
          <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Filtros Ativos:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {options.category && (
                <Chip
                  label={`Categoria: ${options.category}`}
                  onDelete={() => setOptions({ ...options, category: '' })}
                  size="small"
                />
              )}
              {options.distributer && (
                <Chip
                  label={`Fornecedor: ${options.distributer}`}
                  onDelete={() => setOptions({ ...options, distributer: '' })}
                  size="small"
                />
              )}
              {options.lowStockOnly && (
                <Chip
                  label="Apenas estoque baixo"
                  onDelete={() => setOptions({ ...options, lowStockOnly: false })}
                  size="small"
                />
              )}
              {options.transactionType && (
                <Chip
                  label={`Transação: ${options.transactionType}`}
                  onDelete={() => setOptions({ ...options, transactionType: '' })}
                  size="small"
                />
              )}
              {options.activityType && (
                <Chip
                  label={`Atividade: ${options.activityType}`}
                  onDelete={() => setOptions({ ...options, activityType: '' })}
                  size="small"
                />
              )}
            </Stack>
          </Paper>
        )}

        {/* Snackbars */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
};

export default ExportData; 
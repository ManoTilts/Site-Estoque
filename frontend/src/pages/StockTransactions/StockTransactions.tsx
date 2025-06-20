import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Stack,
  Autocomplete,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Undo as UndoIcon,
  BrokenImage as BrokenImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import {
  stockTransactionService,
  StockTransactionType,
  StockTransaction,
  CreateStockTransactionData,
  UpdateStockTransactionData,
  StockTransactionStats,
  productService,
  Item
} from '../../api/funcs';



const StockTransactions: React.FC = () => {
  // State management
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stats, setStats] = useState<StockTransactionStats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateStockTransactionData>({
    item_id: '',
    transaction_type: StockTransactionType.LOSS,
    quantity: 0,
    reason: '',
    notes: '',
    cost_impact: 0,
    reference_number: ''
  });
  
  const [editFormData, setEditFormData] = useState<UpdateStockTransactionData>({
    reason: '',
    notes: '',
    cost_impact: 0,
    reference_number: ''
  });

  // Filters and pagination
  const [filterType, setFilterType] = useState<StockTransactionType | ''>('');
  const [filterItem, setFilterItem] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Check URL parameters for initial filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item');
    if (itemParam) {
      setFilterItem(itemParam);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [page, filterType, filterItem]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transactionsData, statsData, itemsData] = await Promise.all([
        stockTransactionService.getTransactions(
          filterType || undefined,
          filterItem || undefined,
          (page - 1) * itemsPerPage,
          itemsPerPage
        ),
        stockTransactionService.getTransactionStats(),
        productService.getUserProducts()
      ]);

      setTransactions(transactionsData.transactions);
      setTotalPages(Math.ceil(transactionsData.total_count / itemsPerPage));
      setStats(statsData);
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      setError(null);
      await stockTransactionService.createTransaction(formData);
      setSuccess('Transação criada com sucesso!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar transação');
    }
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setError(null);
      await stockTransactionService.updateTransaction(selectedTransaction.id, editFormData);
      setSuccess('Transação atualizada com sucesso!');
      setEditDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar transação');
    }
  };

  const resetForm = () => {
    setFormData({
      item_id: '',
      transaction_type: StockTransactionType.LOSS,
      quantity: 0,
      reason: '',
      notes: '',
      cost_impact: 0,
      reference_number: ''
    });
  };

  const getTransactionTypeIcon = (type: StockTransactionType) => {
    switch (type) {
      case StockTransactionType.LOSS:
        return <TrendingDownIcon />;
      case StockTransactionType.DAMAGE:
        return <BrokenImageIcon />;
      case StockTransactionType.RETURN:
        return <UndoIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const getTransactionTypeColor = (type: StockTransactionType) => {
    switch (type) {
      case StockTransactionType.LOSS:
        return 'error';
      case StockTransactionType.DAMAGE:
        return 'warning';
      case StockTransactionType.RETURN:
        return 'info';
      default:
        return 'default';
    }
  };

  const getTransactionTypeText = (type: StockTransactionType) => {
    switch (type) {
      case StockTransactionType.LOSS:
        return 'Perda';
      case StockTransactionType.DAMAGE:
        return 'Dano';
      case StockTransactionType.RETURN:
        return 'Devolução';
      default:
        return type;
    }
  };

  const getItemName = (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    return item ? item.title : 'Item não encontrado';
  };

  const openEditDialog = (transaction: StockTransaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      reason: transaction.reason,
      notes: transaction.notes || '',
      cost_impact: transaction.cost_impact || 0,
      reference_number: transaction.reference_number || ''
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (transaction: StockTransaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  return (
    <AppLayout pageTitle="Transações de Estoque" currentPage="StockTransactions">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transações de Estoque
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gerencie perdas, danos e devoluções do seu estoque
        </Typography>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center">
                    <TrendingDownIcon color="error" sx={{ mr: 1, fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{stats.loss.count}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Perdas
                      </Typography>
                      <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                        {stats.loss.quantity} unid.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center">
                    <BrokenImageIcon color="warning" sx={{ mr: 1, fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{stats.damage.count}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Danos
                      </Typography>
                      <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.65rem' }}>
                        {stats.damage.quantity} unid.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center">
                    <UndoIcon color="info" sx={{ mr: 1, fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{stats.return.count}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Devoluções
                      </Typography>
                      <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem' }}>
                        {stats.return.quantity} unid.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center">
                    <AssessmentIcon color="primary" sx={{ mr: 1, fontSize: '1.5rem' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>{stats.total.count}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        Total
                      </Typography>
                      <Typography variant="caption" color="primary" sx={{ fontSize: '0.65rem' }}>
                        R$ {stats.total.cost.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Action Bar */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          sx={{ 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ 
              flexWrap: 'wrap', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Filtrar por tipo</InputLabel>
              <Select
                value={filterType}
                label="Filtrar por tipo"
                onChange={(e) => setFilterType(e.target.value as StockTransactionType | '')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value={StockTransactionType.LOSS}>Perdas</MenuItem>
                <MenuItem value={StockTransactionType.DAMAGE}>Danos</MenuItem>
                <MenuItem value={StockTransactionType.RETURN}>Devoluções</MenuItem>
              </Select>
            </FormControl>
            
            <Autocomplete
              options={items}
              getOptionLabel={(option) => option.title}
              value={items.find(item => item.id === filterItem) || null}
              onChange={(_, newValue) => setFilterItem(newValue?.id || '')}
              sx={{ minWidth: { xs: '100%', sm: 200 } }}
              size="small"
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Filtrar por produto" 
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      '& .MuiAutocomplete-endAdornment': {
                        '& .MuiIconButton-root': {
                          padding: '4px',
                        },
                      },
                    },
                  }}
                />
              )}
            />
          </Stack>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            size="small"
            sx={{ 
              alignSelf: { xs: 'stretch', sm: 'auto' },
              minWidth: { xs: '100%', sm: 'auto' }
            }}
          >
            Nova Transação
          </Button>
        </Box>

        {/* Transactions Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Impacto</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma transação encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Chip
                          icon={getTransactionTypeIcon(transaction.transaction_type)}
                          label={getTransactionTypeText(transaction.transaction_type)}
                          color={getTransactionTypeColor(transaction.transaction_type) as any}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            height: '24px',
                            '& .MuiChip-icon': {
                              fontSize: '0.9rem'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{getItemName(transaction.item_id)}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{transaction.quantity}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transaction.reason}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {transaction.cost_impact ? `R$ ${transaction.cost_impact.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Visualizar">
                            <IconButton
                              size="small"
                              onClick={() => openViewDialog(transaction)}
                              sx={{ padding: '4px' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(transaction)}
                              sx={{ padding: '4px' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* Create Transaction Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Nova Transação de Estoque</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={items}
                    getOptionLabel={(option) => option.title}
                    value={items.find(item => item.id === formData.item_id) || null}
                    onChange={(_, newValue) => 
                      setFormData(prev => ({ ...prev, item_id: newValue?.id || '' }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Produto" required />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Transação</InputLabel>
                    <Select
                      value={formData.transaction_type}
                      label="Tipo de Transação"
                      onChange={(e) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          transaction_type: e.target.value as StockTransactionType 
                        }))
                      }
                    >
                      <MenuItem value={StockTransactionType.LOSS}>Perda</MenuItem>
                      <MenuItem value={StockTransactionType.DAMAGE}>Dano</MenuItem>
                      <MenuItem value={StockTransactionType.RETURN}>Devolução</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                    }
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo"
                    required
                    value={formData.reason}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, reason: e.target.value }))
                    }
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Impacto Financeiro"
                    type="number"
                    value={formData.cost_impact}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, cost_impact: parseFloat(e.target.value) || 0 }))
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Referência"
                    value={formData.reference_number}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, reference_number: e.target.value }))
                    }
                    helperText="Para devoluções, ex: NF-001"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateTransaction}
              disabled={!formData.item_id || !formData.reason || formData.quantity <= 0}
            >
              Criar Transação
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Transaction Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Motivo"
                    required
                    value={editFormData.reason}
                    onChange={(e) => 
                      setEditFormData(prev => ({ ...prev, reason: e.target.value }))
                    }
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    multiline
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => 
                      setEditFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Impacto Financeiro"
                    type="number"
                    value={editFormData.cost_impact}
                    onChange={(e) => 
                      setEditFormData(prev => ({ ...prev, cost_impact: parseFloat(e.target.value) || 0 }))
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Referência"
                    value={editFormData.reference_number}
                    onChange={(e) => 
                      setEditFormData(prev => ({ ...prev, reference_number: e.target.value }))
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateTransaction}
              disabled={!editFormData.reason}
            >
              Salvar Alterações
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Transaction Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Detalhes da Transação
            <IconButton
              onClick={() => setViewDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedTransaction && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tipo
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={getTransactionTypeIcon(selectedTransaction.transaction_type)}
                        label={getTransactionTypeText(selectedTransaction.transaction_type)}
                        color={getTransactionTypeColor(selectedTransaction.transaction_type) as any}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Produto
                    </Typography>
                    <Typography variant="body1">
                      {getItemName(selectedTransaction.item_id)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quantidade
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.quantity}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Motivo
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.reason}
                    </Typography>
                  </Grid>
                  
                  {selectedTransaction.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Observações
                      </Typography>
                      <Typography variant="body1">
                        {selectedTransaction.notes}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Impacto Financeiro
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransaction.cost_impact 
                        ? `R$ ${selectedTransaction.cost_impact.toFixed(2)}` 
                        : '-'
                      }
                    </Typography>
                  </Grid>
                  
                  {selectedTransaction.reference_number && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Número de Referência
                      </Typography>
                      <Typography variant="body1">
                        {selectedTransaction.reference_number}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data de Criação
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedTransaction.created_at).toLocaleString('pt-BR')}
                    </Typography>
                  </Grid>
                  
                  {selectedTransaction.updated_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Última Atualização
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedTransaction.updated_at).toLocaleString('pt-BR')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbars */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
};

export default StockTransactions; 
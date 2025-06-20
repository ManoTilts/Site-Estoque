import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Paper,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Edit,
  Inventory,
  AttachMoney,
  Category,
  Business,
  QrCode,
  Image as ImageIcon,
  Warning,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Assessment
} from '@mui/icons-material';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import { productService, Item } from '../../api/funcs';

interface ManageProductFormData {
  title: string;
  description: string;
  category: string;
  distributer: string;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  purchase_price: number;
  sell_price: number;
  image: string;
}

export default function ManageProduct() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = React.useState<Item | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  
  // QR Code states
  const [qrCodeData, setQrCodeData] = React.useState<string>('');
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  const [qrLoading, setQrLoading] = React.useState(false);
  
  const [formData, setFormData] = React.useState<ManageProductFormData>({
    title: '',
    description: '',
    category: '',
    distributer: '',
    unit: '',
    stock: 0,
    low_stock_threshold: 0,
    purchase_price: 0,
    sell_price: 0,
    image: ''
  });

  // Load QR Code for product
  const loadQRCode = async () => {
    if (!productId) return;
    
    setQrLoading(true);
    try {
      const qrData = await productService.generateItemQRCode(productId);
      setQrCodeData(qrData.qr_code);
    } catch (err) {
      console.error('Error loading QR code:', err);
      setError('Erro ao carregar QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeData || !product) return;

    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `qr-code-${product.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print QR Code
  const printQRCode = () => {
    if (!qrCodeData || !product) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${product.title}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
                margin: 20px;
              }
              .product-info {
                margin-bottom: 20px;
              }
              .qr-code {
                max-width: 300px;
                height: auto;
              }
              .barcode {
                font-family: monospace;
                font-size: 14px;
                margin-top: 10px;
                border: 1px solid #ccc;
                padding: 5px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="product-info">
                <h2>${product.title}</h2>
                <p>Código: ${product.barcode || 'N/A'}</p>
                <p>Categoria: ${product.category || 'N/A'}</p>
              </div>
              <img src="${qrCodeData}" alt="QR Code" class="qr-code" />
              <div class="barcode">${product.barcode || 'N/A'}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Carregar dados do produto
  React.useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('ID do produto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productData = await productService.getProduct(productId);
        setProduct(productData);
        
        // Preencher formulário
        setFormData({
          title: productData.title || '',
          description: productData.description || '',
          category: productData.category || '',
          distributer: productData.distributer || '',
          unit: productData.unit || '',
          stock: productData.stock || 0,
          low_stock_threshold: productData.low_stock_threshold || 0,
          purchase_price: productData.purchase_price || 0,
          sell_price: productData.sell_price || 0,
          image: productData.image || ''
        });

        // Load QR Code
        await loadQRCode();
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        setError('Erro ao carregar dados do produto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleInputChange = (field: keyof ManageProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!productId) return;

    // Validações
    if (!formData.title.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }
    
    if (!formData.distributer.trim()) {
      setError('Fornecedor é obrigatório');
      return;
    }
    
    if (formData.stock < 0) {
      setError('Estoque não pode ser negativo');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        distributer: formData.distributer.trim(),
        unit: formData.unit?.trim() || undefined,
        stock: Math.max(0, formData.stock),
        low_stock_threshold: Math.max(0, formData.low_stock_threshold),
        purchase_price: Math.max(0, formData.purchase_price),
        sell_price: Math.max(0, formData.sell_price),
        image: formData.image?.trim() || undefined
      };

      await productService.updateProduct(productId, updateData);
      
      // Recarregar dados do produto
      const updatedProduct = await productService.getProduct(productId);
      setProduct(updatedProduct);
      
      setSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const calculateMargin = () => {
    if (formData.purchase_price > 0 && formData.sell_price > 0) {
      return (((formData.sell_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(2);
    }
    return '0.00';
  };

  const calculateProfit = () => {
    return Math.max(0, formData.sell_price - formData.purchase_price).toFixed(2);
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Gerenciar Produto" currentPage="Home">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (error && !product) {
    return (
      <AppLayout pageTitle="Gerenciar Produto" currentPage="Home">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Voltar
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle={`Gerenciar: ${product?.title || 'Produto'}`} currentPage="Home">
      {/* Header Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Voltar
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Visualizar QR Code">
            <IconButton
              onClick={() => setQrDialogOpen(true)}
              color="primary"
              disabled={qrLoading}
            >
              {qrLoading ? <CircularProgress size={20} /> : <QrCode />}
            </IconButton>
          </Tooltip>
          
          <Button
            startIcon={<Assessment />}
            onClick={() => navigate(`/stock-transactions?item=${productId}`)}
            variant="outlined"
            color="secondary"
          >
            Transações
          </Button>
          
          <Button
            startIcon={<Edit />}
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outlined" : "contained"}
            color={isEditing ? "secondary" : "primary"}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </Box>
      </Box>

      {/* Success/Error Alerts */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Produto atualizado com sucesso!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Product Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory color="primary" />
                Informações do Produto
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome do Produto"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Categoria"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Category />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fornecedor"
                    value={formData.distributer}
                    onChange={(e) => handleInputChange('distributer', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Unidade de Medida"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estoque"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Limite de Estoque Baixo"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    helperText="Receber alerta quando estoque atingir este valor"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Warning />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Código de Barras"
                    value={product?.barcode || 'Não definido'}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCode />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Ver QR Code">
                            <IconButton
                              size="small"
                              onClick={() => setQrDialogOpen(true)}
                              disabled={qrLoading}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="URL da Imagem"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Information - existing sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Preços */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Informações Financeiras
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Preço de Compra"
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Preço de Venda"
                    type="number"
                    value={formData.sell_price}
                    onChange={(e) => handleInputChange('sell_price', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Análise de Margem */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Análise Financeira
              </Typography>
              
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Lucro por Unidade:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    R$ {calculateProfit()}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Margem de Lucro:</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold" 
                    color={parseFloat(calculateMargin()) > 0 ? "success.main" : "error.main"}
                  >
                    {calculateMargin()}%
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Valor Total do Estoque:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    R$ {(formData.stock * formData.purchase_price).toFixed(2)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Valor Potencial de Venda:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    R$ {(formData.stock * formData.sell_price).toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Status do Estoque */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Status do Estoque
              </Typography>
              
              {formData.stock <= (formData.low_stock_threshold || 10) && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Estoque baixo! Limite configurado: {formData.low_stock_threshold || 10}
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Última atualização: {product?.updated_at ? (
                  <>
                    {new Date(product.updated_at).toLocaleString()}
                    <br />
                    <Typography variant="caption" color="text.disabled">
                      Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </Typography>
                  </>
                ) : 'N/A'}
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode color="primary" />
            QR Code do Produto
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {qrLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : qrCodeData ? (
            <Box sx={{ textAlign: 'center' }}>
              <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'inline-block' }}>
                <img
                  src={qrCodeData}
                  alt="QR Code do Produto"
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                />
              </Paper>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Produto:</strong> {product?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Código:</strong> {product?.barcode || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Escaneie este QR Code para acessar rapidamente as informações do produto
              </Typography>
            </Box>
          ) : (
            <Alert severity="error">
              Erro ao carregar QR Code
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Fechar
          </Button>
          {qrCodeData && (
            <>
              <Button
                startIcon={<DownloadIcon />}
                onClick={downloadQRCode}
                variant="outlined"
              >
                Download
              </Button>
              <Button
                startIcon={<PrintIcon />}
                onClick={printQRCode}
                variant="contained"
              >
                Imprimir
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
} 
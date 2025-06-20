import React, { useState, useMemo } from 'react';
import { 
  TextField, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  SelectChangeEvent,
  IconButton,
  InputAdornment,
  Grid,
  Autocomplete,
  Typography,
  Paper,
  Chip,
  Card,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { productService } from '../../../api/funcs';
import QRScanner from '../QRScanner/QRScanner';

export interface CardFormData {
  title: string;
  description: string;
  category: string;
  distributer: string;
  unit: string;
  stock: number;
  low_stock_threshold?: number;
  purchase_price: number;
  sell_price: number;
  image: string;
}

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  onSort: (sortBy: string) => void;
  onAddCard: (cardData: CardFormData) => void;
}

// Predefined categories with icons
const commonCategories = [
  'Electronics',
  'Food & Beverages',
  'Clothing & Apparel',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Office Supplies',
  'Automotive',
  'Toys & Games',
  'Other'
];

// Predefined units/scales with common options organized by type
const unitCategories = {
  'Weight': ['mg', 'g', 'kg', 'oz', 'lb'],
  'Volume': ['ml', 'cl', 'dl', 'l', 'fl oz', 'cup', 'pt', 'qt', 'gal'],
  'Length': ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd'],
  'Quantity': ['pcs', 'units', 'dozen', 'pair', 'set'],
  'Packaging': ['pack', 'box', 'bottle', 'bag', 'can', 'jar']
};

const allUnits = Object.values(unitCategories).flat();

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onSort, onAddCard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title-asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<CardFormData>({
    title: '',
    description: '',
    category: '',
    distributer: '',
    unit: '',
    stock: 0,
    low_stock_threshold: 10,
    purchase_price: 0,
    sell_price: 0,
    image: ''
  });

  // QR Code scanner states
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrCodeResult, setQrCodeResult] = useState<string>('');
  const [qrProcessing, setQrProcessing] = useState(false);
  const [qrAlert, setQrAlert] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Helper function to validate URL - defined early to avoid hoisting issues
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const steps = [
    {
      label: 'Basic Information',
      description: 'Product name and description',
      icon: <InfoIcon />
    },
    {
      label: 'Inventory Details',
      description: 'Stock, unit, and supplier information',
      icon: <InventoryIcon />
    },
    {
      label: 'Pricing & Image',
      description: 'Price and product image',
      icon: <AttachMoneyIcon />
    }
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortOption(value);
    onSort(value);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setActiveStep(0);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setActiveStep(0);
    setFormErrors({});
    setImagePreview('');
    setQrCodeResult(''); // Clear QR code result
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      distributer: '',
      unit: '',
      stock: 0,
      low_stock_threshold: 10,
      purchase_price: 0,
      sell_price: 0,
      image: ''
    });
  };

  // Function to get validation errors without setting state
  const getStepErrors = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 0:
        if (!formData.title.trim()) {
          errors.title = 'Product name is required';
        } else if (formData.title.length < 2) {
          errors.title = 'Product name must be at least 2 characters';
        }
        break;
      case 1:
        if (!formData.distributer.trim()) {
          errors.distributer = 'Distributor name is required';
        }
        if (!formData.unit.trim()) {
          errors.unit = 'Unit is required';
        }
        if (formData.stock < 0) {
          errors.stock = 'Stock cannot be negative';
        }
        if (formData.low_stock_threshold !== undefined && formData.low_stock_threshold < 0) {
          errors.low_stock_threshold = 'Threshold cannot be negative';
        }
        break;
      case 2:
        if (formData.purchase_price < 0) {
          errors.purchase_price = 'Purchase price cannot be negative';
        }
        if (formData.sell_price < 0) {
          errors.sell_price = 'Sell price cannot be negative';
        }
        if (formData.image && !isValidUrl(formData.image)) {
          errors.image = 'Please enter a valid URL';
        }
        break;
    }
    
    return errors;
  };

  // Function that validates and updates form errors
  const validateStep = (step: number): boolean => {
    const errors = getStepErrors(step);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Memoized validation for current step (for button disabled state)
  const isCurrentStepValid = useMemo(() => {
    const errors = getStepErrors(activeStep);
    return Object.keys(errors).length === 0;
  }, [formData, activeStep]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'low_stock_threshold' || name === 'purchase_price' || name === 'sell_price' ? Number(value) : value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Handle image preview
    if (name === 'image' && value && isValidUrl(value)) {
      setImagePreview(value);
    } else if (name === 'image') {
      setImagePreview('');
    }
  };

  const handleCategoryChange = (_event: React.SyntheticEvent<Element, Event>, newValue: string | null) => {
    setFormData(prev => ({
      ...prev,
      category: newValue || ''
    }));
  };

  const handleUnitChange = (_event: React.SyntheticEvent<Element, Event>, newValue: string | null) => {
    setFormData(prev => ({
      ...prev,
      unit: newValue || ''
    }));
    
    if (formErrors.unit) {
      setFormErrors(prev => ({ ...prev, unit: '' }));
    }
  };

  // QR Code handlers
  const handleQRScan = async (qrData: string) => {
    setQrProcessing(true);
    setQrCodeResult(qrData);
    
    try {
      const result = await productService.processQRScan(qrData);
      
      if (result.type === 'product' || result.type === 'barcode') {
        // Product found, show success message
        setQrAlert({
          message: result.message,
          severity: 'success'
        });
        
        // Could navigate to product details or show product info
        console.log('Product found:', result.item);
        
        // You might want to call a callback to handle the found product
        // onProductFound?.(result.item);
        
      } else {
        // Unknown QR code, offer to create new product
        setQrAlert({
          message: result.message,
          severity: 'info'
        });
        
        // Pre-fill form with QR data if it's a barcode
        if (qrData && qrData.length > 0) {
          setFormData(prev => ({
            ...prev,
            title: `Produto ${qrData}`,
            description: `Produto escaneado via QR Code: ${qrData}`
          }));
          
          // Open create product dialog
          setIsDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setQrAlert({
        message: 'Erro ao processar QR Code. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setQrProcessing(false);
    }
  };

  const handleQRScannerClose = () => {
    setQrScannerOpen(false);
    setQrCodeResult('');
  };

  const handleSubmit = async () => {
    if (validateStep(2)) {
      try {
        // If we have QR code data, use the QR-specific creation endpoint
        if (qrCodeResult) {
          await productService.createItemFromQR(
            {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              distributer: formData.distributer,
              unit: formData.unit,
              stock: formData.stock,
              low_stock_threshold: formData.low_stock_threshold,
              purchase_price: formData.purchase_price,
              sell_price: formData.sell_price,
              image: formData.image
            },
            qrCodeResult
          );
        } else {
          // Regular product creation
          await onAddCard(formData);
        }
        
        handleCloseDialog();
        setQrAlert({
          message: 'Produto criado com sucesso!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error creating product:', error);
        setQrAlert({
          message: 'Erro ao criar produto. Tente novamente.',
          severity: 'error'
        });
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  // Form validation
  const isFormValid = () => {
    // Check all steps for errors
    const allErrors = [
      ...Object.keys(getStepErrors(0)),
      ...Object.keys(getStepErrors(1)),
      ...Object.keys(getStepErrors(2))
    ];
    
    return formData.title.trim() !== '' && 
           formData.distributer.trim() !== '' && 
           formData.unit.trim() !== '' &&
           formData.stock >= 0 &&
           formData.purchase_price >= 0 &&
           formData.sell_price >= 0 &&
           allErrors.length === 0;
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Product Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      variant="outlined"
                      required
                      error={!!formErrors.title}
                      helperText={formErrors.title || "Enter a clear, descriptive product name"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <InventoryIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      variant="outlined"
                      multiline
                      rows={4}
                      helperText="Describe the product features, specifications, and important details"
                      placeholder="e.g., Color, size, material, special features..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          alignItems: 'stretch',
                        },
                        '& .MuiOutlinedInput-input': {
                          overflow: 'hidden',
                          wordWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      freeSolo
                      options={commonCategories}
                      value={formData.category}
                      onChange={handleCategoryChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Category"
                          variant="outlined"
                          helperText="Select or enter a product category"
                          placeholder="e.g., Electronics, Food, Clothing"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Inventory & Supplier
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Distributor/Supplier"
                      name="distributer"
                      value={formData.distributer}
                      onChange={handleFormChange}
                      variant="outlined"
                      required
                      error={!!formErrors.distributer}
                      helperText={formErrors.distributer || "Name of the supplier or distributor"}
                      placeholder="e.g., ABC Company, Local Supplier"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleFormChange}
                      variant="outlined"
                      required
                      error={!!formErrors.stock}
                      helperText={formErrors.stock || "Current available stock"}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Low Stock Threshold"
                      name="low_stock_threshold"
                      type="number"
                      value={formData.low_stock_threshold || 10}
                      onChange={handleFormChange}
                      variant="outlined"
                      error={!!formErrors.low_stock_threshold}
                      helperText="Alert when stock reaches this level"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={allUnits}
                      value={formData.unit}
                      onChange={handleUnitChange}
                      groupBy={(option) => {
                        for (const [category, units] of Object.entries(unitCategories)) {
                          if (units.includes(option)) return category;
                        }
                        return 'Other';
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Unit/Scale"
                          variant="outlined"
                          required
                          error={!!formErrors.unit}
                          helperText={formErrors.unit || "e.g., kg, ml, pcs, etc."}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  <AttachMoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Pricing & Image
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Purchase Price"
                      name="purchase_price"
                      type="number"
                      value={formData.purchase_price}
                      onChange={handleFormChange}
                      variant="outlined"
                      error={!!formErrors.purchase_price}
                      helperText={formErrors.purchase_price || "Cost per unit"}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sell Price"
                      name="sell_price"
                      type="number"
                      value={formData.sell_price}
                      onChange={handleFormChange}
                      variant="outlined"
                      error={!!formErrors.sell_price}
                      helperText={formErrors.sell_price || "Sale price per unit"}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`Margin: ${formData.purchase_price > 0 && formData.sell_price > 0 ? 
                          (((formData.sell_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(2) + '%' : 
                          '0%'}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={`Profit per unit: $${Math.max(0, formData.sell_price - formData.purchase_price).toFixed(2)}`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip 
                        label={`Total Investment: $${(formData.purchase_price * formData.stock).toFixed(2)}`}
                        color="warning"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Image URL"
                      name="image"
                      value={formData.image}
                      onChange={handleFormChange}
                      variant="outlined"
                      error={!!formErrors.image}
                      helperText={formErrors.image || "Optional: URL of the product image"}
                      placeholder="https://example.com/image.jpg"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhotoCameraIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {imagePreview && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Image Preview:
                        </Typography>
                        <Box
                          component="img"
                          src={imagePreview}
                          alt="Product preview"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            objectFit: 'contain',
                            borderRadius: 1,
                          }}
                          onError={() => setImagePreview('')}
                        />
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2, 
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <TextField
          placeholder="Buscar produtos..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={sortOption}
            label="Ordenar por"
            onChange={handleSortChange}
          >
            <MenuItem value="title-asc">Nome (A-Z)</MenuItem>
            <MenuItem value="title-desc">Nome (Z-A)</MenuItem>
            <MenuItem value="stock-asc">Estoque (Menor)</MenuItem>
            <MenuItem value="stock-desc">Estoque (Maior)</MenuItem>
            <MenuItem value="sell_price-asc">Preço (Menor)</MenuItem>
            <MenuItem value="sell_price-desc">Preço (Maior)</MenuItem>
            <MenuItem value="created_at-desc">Mais Recente</MenuItem>
            <MenuItem value="created_at-asc">Mais Antigo</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Fab
            color="secondary"
            size="small"
            onClick={() => setQrScannerOpen(true)}
            sx={{ minWidth: 'auto' }}
          >
            <QrCodeScannerIcon />
          </Fab>
          
          <Fab
            color="primary"
            size="small"
            onClick={handleOpenDialog}
            sx={{ minWidth: 'auto' }}
          >
            <AddIcon />
          </Fab>
        </Box>
      </Box>

      {/* QR Code Scanner Dialog */}
      <QRScanner
        open={qrScannerOpen}
        onClose={handleQRScannerClose}
        onScan={handleQRScan}
        title="Escanear Produto"
      />

      {/* QR Processing Indicator */}
      {qrProcessing && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}

      {/* QR Alert Snackbar */}
      {qrAlert && (
        <Snackbar
          open={!!qrAlert}
          autoHideDuration={6000}
          onClose={() => setQrAlert(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity={qrAlert.severity}
            onClose={() => setQrAlert(null)}
            sx={{ width: '100%' }}
          >
            {qrAlert.message}
          </Alert>
        </Snackbar>
      )}

      {/* Create Product Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            {qrCodeResult ? 'Criar Produto do QR Code' : 'Adicionar Novo Produto'}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Show QR Code info if available */}
        {qrCodeResult && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeIcon />
                <Typography variant="body2">
                  <strong>QR Code detectado:</strong> {qrCodeResult}
                </Typography>
              </Box>
            </Alert>
          </Box>
        )}

        <DialogContent sx={{ pt: 2 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: index <= activeStep ? '#1976d2' : '#e0e0e0',
                      color: index <= activeStep ? 'white' : '#666'
                    }}>
                      {React.cloneElement(step.icon, { fontSize: 'small' })}
                    </div>
                  )}
                >
                  <Typography variant="h6">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    {getStepContent(index)}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog} size="large">
            Cancelar
          </Button>
          {activeStep < steps.length - 1 ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep > 0 && (
                <Button onClick={handleBack} size="large">
                  Voltar
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={handleNext} 
                disabled={!isCurrentStepValid}
                size="large"
              >
                Próximo
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={handleBack} size="large">
                Voltar
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit} 
                disabled={!isFormValid()}
                size="large"
                startIcon={<AddIcon />}
              >
                {qrCodeResult ? 'Criar do QR Code' : 'Criar Produto'}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SearchBar;
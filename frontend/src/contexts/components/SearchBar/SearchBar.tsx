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
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export interface CardFormData {
  title: string;
  description: string;
  category: string;
  distributer: string;
  unit: string;
  stock: number;
  price: number;
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
    price: 0,
    image: ''
  });

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
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: '',
      distributer: '',
      unit: '',
      stock: 0,
      price: 0,
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
        break;
      case 2:
        if (formData.price < 0) {
          errors.price = 'Price cannot be negative';
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
      [name]: name === 'stock' || name === 'price' ? Number(value) : value
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

  const handleSubmit = () => {
    if (validateStep(2)) {
      onAddCard(formData);
      handleCloseDialog();
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
           formData.price >= 0 &&
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
                      label="Price per Unit"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleFormChange}
                      variant="outlined"
                      required
                      error={!!formErrors.price}
                      helperText={formErrors.price || "Price in your local currency"}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <Chip 
                        label={`Total Value: $${(formData.price * formData.stock).toFixed(2)}`}
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '1rem', p: 2 }}
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 2 }}>
      {/* Search Field */}
      <TextField
        sx={{ flexGrow: 1 }}
        variant="outlined"
        label="Search Products"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton onClick={clearSearch} edge="end" size="small">
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      {/* Sort Dropdown */}
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortOption}
          label="Sort By"
          onChange={handleSortChange}
        >
          <MenuItem value="title-asc">Title A-Z</MenuItem>
          <MenuItem value="title-desc">Title Z-A</MenuItem>
          <MenuItem value="price-asc">Price: Low to High</MenuItem>
          <MenuItem value="price-desc">Price: High to Low</MenuItem>
          <MenuItem value="stock-asc">Stock: Low to High</MenuItem>
          <MenuItem value="stock-desc">Stock: High to Low</MenuItem>
        </Select>
      </FormControl>

      {/* Add Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleOpenDialog}
        tabIndex={isDialogOpen ? -1 : 0}
        sx={{ 
          boxShadow: 3,
          transition: 'transform 0.2s ease-in-out',
          opacity: isDialogOpen ? 0.5 : 1,
          pointerEvents: isDialogOpen ? 'none' : 'auto',
          '&:hover': {
            transform: !isDialogOpen ? 'scale(1.1)' : 'none'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Enhanced Add Product Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" component="div">
              Add New Product
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(activeStep + 1) * 33.33} 
            sx={{ mt: 2, mb: 1 }}
          />
        </DialogTitle>
        
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
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={!isCurrentStepValid}
              sx={{
                backgroundColor: isCurrentStepValid ? 'primary.main' : 'grey.300',
                color: isCurrentStepValid ? 'white' : 'grey.500',
                '&:hover': {
                  backgroundColor: isCurrentStepValid ? 'primary.dark' : 'grey.400',
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                }
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!isFormValid()}
              color="success"
              sx={{
                backgroundColor: isFormValid() ? 'success.main' : 'grey.300',
                color: isFormValid() ? 'white' : 'grey.500',
                '&:hover': {
                  backgroundColor: isFormValid() ? 'success.dark' : 'grey.400',
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                }
              }}
            >
              Add Product
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchBar;
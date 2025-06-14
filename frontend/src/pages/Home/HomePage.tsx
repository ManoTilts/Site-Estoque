import * as React from 'react';
import Typography from '@mui/material/Typography';
import ProductCard from '../../contexts/components/ProductCard/ProductCard'; 
import Grid from '@mui/material/Grid'; 
import SearchBar, { CardFormData } from '../../contexts/components/SearchBar/SearchBar';
import { 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Alert
} from '@mui/material';
import { productService, Item } from '../../api/funcs';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';

// Form data interface for managing products
interface ManageProductFormData {
  name: string;
  description: string;
  category: string;
  distributer: string;
  unit: string;
  stock: number;
  price: number;
  image: string;
}

export default function HomePage() {
  const [products, setProducts] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('');
  
  // State for manage product dialog
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState<ManageProductFormData>({
    name: '',
    description: '',
    category: '',
    distributer: '',
    unit: '',
    stock: 0,
    price: 0,
    image: ''
  });

  // Function to fetch products from the backend using productService
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // JWT token authentication handles user identification automatically
      const data = await productService.getUserProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Show empty state by setting empty array
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle adding a new product
  const handleAddProduct = async (cardData: CardFormData) => {
    try {
      // JWT authentication automatically provides user ID
      const productData = {
        name: cardData.title,
        description: cardData.description || undefined,
        category: cardData.category || undefined,
        distributer: cardData.distributer,
        unit: cardData.unit || undefined,
        stock: cardData.stock,
        price: cardData.price,
        image: cardData.image || undefined
      };

      // Create the product using the productService
      await productService.createProduct(productData);
      
      // Refresh the products list
      await fetchProducts();
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      // Type guard for axios error
      const isAxiosError = (err: unknown): err is { response?: { status: number } } => {
        return err !== null && typeof err === 'object' && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 401) {
        alert('Please log in to add products. You will be redirected to the login page.');
        // Optionally redirect to login page
        // navigate('/login');
      } else {
        alert('Failed to add product. Please try again.');
      }
    }
  };
  // Function to handle managing a product
  const handleManageProduct = React.useCallback((productId: string) => {
    console.log('Managing product:', productId);
    console.log('Available products:', products.map(p => ({ id: p.id, name: p.name })));
    
    // Find the product by ID
    const product = products.find(p => p.id === productId);
    if (product) {
      console.log('Found product:', product);
      
      // Reset form data with proper defaults to ensure all fields are editable
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        distributer: product.distributer || '',
        unit: product.unit || '',
        stock: typeof product.stock === 'number' ? product.stock : 0,
        price: typeof product.price === 'number' ? product.price : 0,
        image: product.image || ''
      });
      
      // Set the selected product ID
      setSelectedProductId(productId);
      
      // Clear any previous errors/success states
      setUpdateError(null);
      setUpdateSuccess(false);
      
      // Open the dialog
      setManageDialogOpen(true);
    } else {
      console.error('Product not found with ID:', productId);
      console.error('Available product IDs:', products.map(p => p.id));
      alert('Product not found. Please refresh the page and try again.');
    }
  }, [products]);

  // Function to handle product update
  const handleUpdateProduct = async () => {
    if (!selectedProductId) return;

    // Validate required fields
    if (!formData.name?.trim()) {
      setUpdateError('Product name is required');
      return;
    }
    
    if (!formData.distributer?.trim()) {
      setUpdateError('Distributor is required');
      return;
    }
    
    if (formData.stock < 0) {
      setUpdateError('Stock cannot be negative');
      return;
    }
    
    if (formData.price < 0) {
      setUpdateError('Price cannot be negative');
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Map frontend fields to backend expected fields
      const backendData = {
        title: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        distributer: formData.distributer.trim(),
        unit: formData.unit?.trim() || undefined,
        stock: Math.max(0, formData.stock),
        price: Math.max(0, formData.price),
        image: formData.image?.trim() || undefined
      };

      await productService.updateProduct(selectedProductId, backendData);
      
      // Refresh the products list
      await fetchProducts();
      
      setUpdateSuccess(true);
      setTimeout(() => {
        handleCloseManageDialog();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating product:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        setUpdateError(`Failed to update product: ${error.message}`);
      } else {
        setUpdateError('Failed to update product. Please check your connection and try again.');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to close manage dialog
  const handleCloseManageDialog = () => {
    setManageDialogOpen(false);
    setSelectedProductId(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      distributer: '',
      unit: '',
      stock: 0,
      price: 0,
      image: ''
    });
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  // Filter and sort products based on search term and sort criteria
  const filteredProducts = React.useMemo(() => {
    // First filter products by search term
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Then sort based on sortBy value
    if (!sortBy) return filtered;
    
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
        case 'name':
          return a.name.localeCompare(b.name);
        case 'title-desc':
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
        case 'price':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
        case 'stock':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        // Add more sort options as needed
        default:
          return 0;
      }
    });
  }, [products, searchTerm, sortBy]);
  
  // Load products when component mounts
  React.useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <AppLayout pageTitle="Home Page" currentPage="Home">
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
            Product Inventory
          </Typography>
          <Typography sx={{ marginBottom: 2 }}>
            Welcome to the product management system. Here you can search, sort, and manage your product inventory.
      </Typography>
      <SearchBar 
            onSearch={(searchTerm: string) => {
              console.log('Searching for:', searchTerm);
              setSearchTerm(searchTerm);
            }}
            onSort={(sortBy: string) => {
              console.log('Sorting by:', sortBy);
              setSortBy(sortBy);
            }}
            onAddCard={handleAddProduct}
      />
      <Grid container spacing={3} sx={{ mt: 3, px: 2 }}>
            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Grid>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
                <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={product.id || `product-${index}`} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch' }}>
                  <ProductCard
                    title={product.name}
                    description={product.description || ''}
                    imageUrl={product.image || ''}
                    price={product.price}
                    stock={product.stock}
                    category={product.category}
                    distributer={product.distributer}
                    unit={product.unit}
                    onManageItem={() => {
                      console.log('ProductCard clicked for product:', { id: product.id, name: product.name });
                      if (product.id) {
                        handleManageProduct(product.id);
                      } else {
                        console.error('Product ID is undefined, cannot manage product:', product);
                        alert('Error: Product ID is missing. Please refresh the page and try again.');
                      }
                    }}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="subtitle1" align="center" sx={{ mt: 4 }}>
                  There are currently no registered products.
                </Typography>
              </Grid>
            )}
          </Grid>

      {/* Product Management Dialog */}
             <Dialog 
         open={manageDialogOpen} 
         onClose={handleCloseManageDialog} 
         maxWidth="md" 
         fullWidth
         PaperProps={{
           sx: {
             borderRadius: 2,
             minHeight: '600px'
           }
         }}
       >
         <DialogTitle sx={{ 
           bgcolor: 'primary.main', 
           color: 'primary.contrastText',
           position: 'relative',
           py: 2
         }}>
           <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
             Edit Product
           </Typography>
           <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
             Update the information for "{formData.name}"
           </Typography>
           {import.meta.env.DEV && selectedProductId && (
             <Typography variant="caption" sx={{ 
               position: 'absolute', 
               top: 8, 
               right: 16,
               opacity: 0.7,
               fontSize: '0.7rem'
             }}>
               ID: {selectedProductId.slice(-8)}
             </Typography>
           )}
         </DialogTitle>
         <DialogContent sx={{ p: 3 }}>
           <Grid container spacing={3} sx={{ mt: 1 }}>
             {/* Row 1: Product Name and Category */}
             <Grid item xs={12} md={8}>
               <TextField
                 label="Product Name"
                 value={formData.name || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 fullWidth
                 required
                 variant="outlined"
                 helperText="Enter the product name"
               />
             </Grid>
             <Grid item xs={12} md={4}>
               <TextField
                 label="Category"
                 value={formData.category || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                 fullWidth
                 variant="outlined"
                 helperText="Product category"
               />
             </Grid>
             
             {/* Row 2: Description - Full Width */}
             <Grid item xs={12}>
               <TextField
                 label="Description"
                 value={formData.description || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                 fullWidth
                 multiline
                 rows={3}
                 variant="outlined"
                 helperText="Detailed product description"
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
             
             {/* Row 3: Distributor and Unit */}
             <Grid item xs={12} md={6}>
               <TextField
                 label="Distributor"
                 value={formData.distributer || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, distributer: e.target.value }))}
                 fullWidth
                 required
                 variant="outlined"
                 helperText="Supplier/Distributor name"
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <TextField
                 label="Unit of Measure"
                 value={formData.unit || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                 fullWidth
                 variant="outlined"
                 placeholder="e.g., kg, units, liters"
                 helperText="How the product is measured"
               />
             </Grid>
             
             {/* Row 4: Stock and Price */}
             <Grid item xs={12} md={6}>
               <TextField
                 label="Stock Quantity"
                 type="number"
                 value={formData.stock?.toString() || '0'}
                 onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) || 0 }))}
                 fullWidth
                 required
                 variant="outlined"
                 inputProps={{ min: 0 }}
                 helperText="Current stock level"
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <TextField
                 label="Price"
                 type="number"
                 value={formData.price?.toString() || '0'}
                 onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                 fullWidth
                 required
                 variant="outlined"
                 inputProps={{ step: "0.01", min: 0 }}
                 helperText="Price per unit"
               />
             </Grid>
             
             {/* Row 5: Image URL - Full Width */}
             <Grid item xs={12}>
               <TextField
                 label="Image URL"
                 value={formData.image || ''}
                 onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                 fullWidth
                 variant="outlined"
                 placeholder="https://example.com/image.jpg"
                 helperText="Optional: URL to product image"
               />
             </Grid>
             
             {/* Row 6: Error/Success Messages */}
             {(updateError || updateSuccess) && (
               <Grid item xs={12}>
                 {updateError && (
                   <Alert severity="error" sx={{ mb: 1 }}>
                     {updateError}
                   </Alert>
                 )}
                 {updateSuccess && (
                   <Alert severity="success">
                     Product updated successfully!
                   </Alert>
                 )}
               </Grid>
             )}
           </Grid>
         </DialogContent>
         <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 2 }}>
           <Button 
             onClick={handleCloseManageDialog} 
             disabled={updateLoading}
             variant="outlined"
             size="large"
             sx={{ minWidth: 100 }}
           >
             Cancel
           </Button>
           <Button 
             onClick={handleUpdateProduct} 
             variant="contained"
             disabled={updateLoading || !formData.name || !formData.distributer}
             size="large"
             sx={{ minWidth: 140 }}
           >
             {updateLoading ? (
               <>
                 <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                 Updating...
               </>
             ) : (
               'Update Product'
             )}
           </Button>
         </DialogActions>
       </Dialog>
    </AppLayout>
  );
}

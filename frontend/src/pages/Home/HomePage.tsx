import * as React from 'react';
import Typography from '@mui/material/Typography';
import ProductCard from '../../contexts/components/ProductCard/ProductCard'; 
import Grid from '@mui/material/Grid'; 
import SearchBar, { CardFormData } from '../../contexts/components/SearchBar/SearchBar';
import { 
  CircularProgress
} from '@mui/material';
import { productService, Item } from '../../api/funcs';
import AppLayout from '../../contexts/components/AppLayout/AppLayout';
import { useNavigate } from 'react-router-dom';



export default function HomePage() {
  const [products, setProducts] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('');
  


  const navigate = useNavigate();

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
        low_stock_threshold: cardData.low_stock_threshold || 10,
        purchase_price: cardData.purchase_price,
        sell_price: cardData.sell_price,
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
    
    // Navigate to the manage product page
    navigate(`/manage-product/${productId}`);
  }, [navigate]);



  // Filter and sort products based on search term and sort criteria
  const filteredProducts = React.useMemo(() => {
    // First filter products by search term
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.distributer && product.distributer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Then sort based on sortBy value
    if (!sortBy) return filtered;
    
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.name.localeCompare(b.name);
        case 'title-desc':
          return b.name.localeCompare(a.name);
        case 'sell_price-asc':
          return (a.sell_price || 0) - (b.sell_price || 0);
        case 'sell_price-desc':
          return (b.sell_price || 0) - (a.sell_price || 0);
        case 'stock-asc':
          return a.stock - b.stock;
        case 'stock-desc':
          return b.stock - a.stock;
        case 'created_at-desc':
          // Sort by creation date if available, fallback to alphabetical
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return b.name.localeCompare(a.name);
        case 'created_at-asc':
          // Sort by creation date if available, fallback to alphabetical
          if (a.created_at && b.created_at) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return a.name.localeCompare(b.name);
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
                    price={product.sell_price || product.purchase_price || 0}
                    stock={product.stock}
                    low_stock_threshold={product.low_stock_threshold}
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


    </AppLayout>
  );
}

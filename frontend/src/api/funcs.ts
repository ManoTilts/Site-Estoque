import apiClient from './axiosconfig';

// Define the Item interface based on your backend data structure
export interface Item {
  id: string;
  title: string;  // Maps to backend 'title' field
  name: string;   // Frontend display name
  description?: string;
  category?: string;
  distributer: string;
  unit?: string;
  stock: number;
  price: number;
  barcode?: string;
  image?: string;
  associatedUser: string;  // Note: backend uses 'associatedUser' not 'associatedUsers'
}

// Create item payload interface for backend
interface CreateItemPayload {
  title: string;
  description?: string;
  category?: string;
  distributer: string;
  unit?: string;
  stock: number;
  price: number;
  image?: string;
  associatedUser: string;
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties as needed
}

// Base API URL
// API configuration handled by axiosConfig

// Product service for handling item-related API calls
export const productService = {
  // Get all items for a user using optimized endpoint
  async getUserProducts(): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/items/my`);
      // The new endpoint returns properly formatted data
      return response.data.map((item: any) => ({
        ...item,
        name: item.title, // Map title to name for frontend display
        id: item.id || item._id || String(item._id) // Ensure ID is properly mapped
      }));
    } catch (error) {
      console.error('Error fetching user items:', error);
      throw error;
    }
  },

  // Search user items with optimized text search
  async searchUserProducts(userId: string, searchTerm: string): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/`, {
        params: { search: searchTerm }
      });
      return response.data.map((item: any) => ({
        ...item,
        name: item.title,
        id: item.id || item._id || String(item._id)
      }));
    } catch (error) {
      console.error('Error searching user items:', error);
      throw error;
    }
  },

  // Get user items with sorting using optimized endpoint
  async getUserProductsSorted(
    userId: string, 
    sortBy: string = 'title', 
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/`, {
        params: { 
          sort_by: sortBy, 
          sort_order: sortOrder 
        }
      });
      return response.data.map((item: any) => ({
        ...item,
        name: item.title,
        id: item.id || item._id || String(item._id)
      }));
    } catch (error) {
      console.error('Error fetching sorted user items:', error);
      throw error;
    }
  },

  // Filter user items using optimized endpoint
  async filterUserProducts(
    userId: string,
    filters: {
      category?: string;
      distributer?: string;
      minStock?: number;
      maxStock?: number;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/`, {
        params: {
          category: filters.category,
          distributer: filters.distributer,
          min_stock: filters.minStock,
          max_stock: filters.maxStock,
          min_price: filters.minPrice,
          max_price: filters.maxPrice
        }
      });
      return response.data.map((item: any) => ({
        ...item,
        name: item.title,
        id: item.id || item._id || String(item._id)
      }));
    } catch (error) {
      console.error('Error filtering user items:', error);
      throw error;
    }
  },

  // Get low stock items
  async getLowStockItems(userId: string, threshold: number = 10): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/low-stock`, {
        params: { threshold }
      });
      return response.data.map((item: any) => ({
        ...item,
        name: item.title,
        id: item.id || item._id || String(item._id)
      }));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get user's categories
  async getUserCategories(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/categories`);
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching user categories:', error);
      throw error;
    }
  },

  // Get user's distributors
  async getUserDistributors(userId: string): Promise<string[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/distributors`);
      return response.data.distributors;
    } catch (error) {
      console.error('Error fetching user distributors:', error);
      throw error;
    }
  },

  // Get item count for user
  async getUserItemCount(userId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/count`);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching user item count:', error);
      throw error;
    }
  },

  // Get item by barcode (uses unique index)
  async getProductByBarcode(barcode: string): Promise<Item> {
    try {
      const response = await apiClient.get(`/api/items/barcode/${barcode}`);
      return {
        ...response.data,
        name: response.data.title,
        id: response.data.id || response.data._id || String(response.data._id)
      };
    } catch (error) {
      console.error('Error fetching item by barcode:', error);
      throw error;
    }
  },

  // Get a single item by ID
  async getProduct(itemId: string): Promise<Item> {
    try {
      const item = await getItemById(itemId);
      return {
        ...item,
        name: item.title,
        id: item.id || (item as any)._id
      };
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  },

  // Create a new item for a user
  async createProduct(itemData: {
    name: string;
    description?: string;
    category?: string;
    distributer: string;
    unit?: string;
    stock: number;
    price: number;
    image?: string;
  }): Promise<Item> {
    try {
      // Map frontend data to backend field names
      const backendPayload: CreateItemPayload = {
        title: itemData.name,  // Map name to title for backend
        description: itemData.description,
        category: itemData.category,
        distributer: itemData.distributer,
        unit: itemData.unit,
        stock: itemData.stock,
        price: itemData.price,
        image: itemData.image,
        associatedUser: ''  // This will be set by the backend from JWT token
      };

      const response = await apiClient.post('/api/items/', backendPayload);
      return {
        ...response.data,
        name: response.data.title,
        id: response.data.id || response.data._id || String(response.data._id)
      };
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update an existing item
  async updateProduct(itemId: string, itemData: Partial<Item>): Promise<Item> {
    try {
      // Map frontend field names to backend field names
      const backendData: any = { ...itemData };
      if (itemData.name) {
        backendData.title = itemData.name;
        delete backendData.name;
      }
      if (backendData.associatedUsers) {
        backendData.associatedUser = backendData.associatedUsers;
        delete backendData.associatedUsers;
      }
      
      const updatedItem = await updateItem(itemId, backendData);
      return {
        ...updatedItem,
        name: updatedItem.title,
        id: updatedItem.id || (updatedItem as any)._id
      };
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete an item
  async deleteProduct(itemId: string): Promise<void> {
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }
};

// GET /api/items - Get all items
export const getAllItems = async (): Promise<Item[]> => {
  const response = await apiClient.get('/api/items');
  return response.data.map((item: any) => ({
    ...item,
    name: item.title,
    id: item.id || item._id || String(item._id)
  }));
};

// POST /api/items - Create a new item
export const createItem = async (item: CreateItemPayload): Promise<Item> => {
  const response = await apiClient.post('/api/items', item);
  return {
    ...response.data,
    name: response.data.title,
    id: response.data.id || response.data._id || String(response.data._id)
  };
};

// GET /api/items/{id} - Get a specific item
export const getItemById = async (id: string): Promise<Item> => {
  const response = await apiClient.get(`/api/items/${id}`);
  return {
    ...response.data,
    name: response.data.title,
    id: response.data.id || response.data._id || String(response.data._id)
  };
};

// PUT /api/items/{id} - Update a specific item
export const updateItem = async (id: string, item: any): Promise<Item> => {
  const response = await apiClient.put(`/api/items/${id}`, item);
  return {
    ...response.data,
    name: response.data.title,
    id: response.data.id || response.data._id || String(response.data._id)
  };
};

// DELETE /api/items/{id} - Delete a specific item
export const deleteItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/items/${id}`);
};

// GET / - Root endpoint
export const getRoot = async (): Promise<any> => {
  const response = await apiClient.get('/api');
  return response.data;
};

// Export the productService as default for easier importing
export default productService;

// Dashboard-specific data aggregation functions
export interface DashboardData {
  totalProducts: number;
  lowStockItems: Item[];
  totalValue: number;
  categories: string[];
  allProducts: Item[];
  distributors: string[];
}

export interface DashboardKPIs {
  totalProducts: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  lowStockItems: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  totalValue: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  categories: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  monthlyOrders: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
  reorderPoints: { value: number; change: number; trend: 'up' | 'down' | 'neutral' };
}

// Dashboard service for aggregated data
export const dashboardService = {
  // Get all dashboard data in a single call
  async getDashboardData(lowStockThreshold: number = 10): Promise<DashboardData> {
    try {
      // Fetch all data in parallel for optimal performance
      const [
        allProducts,
        categories,
        distributors
      ] = await Promise.all([
        productService.getUserProducts(),
        // Use fallback if getUserCategories requires userId but we want auth-based
        apiClient.get('/api/categories').then(res => res.data.categories).catch(() => []),
        apiClient.get('/api/distributors').then(res => res.data.distributors).catch(() => [])
      ]);

      // Filter low stock items from all products
      const lowStockItems = allProducts.filter(product => product.stock <= lowStockThreshold);

      // Calculate total inventory value
      const totalValue = allProducts.reduce((sum, product) => {
        return sum + (product.price * product.stock);
      }, 0);

      return {
        totalProducts: allProducts.length,
        lowStockItems,
        totalValue,
        categories,
        allProducts,
        distributors
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get dashboard KPIs with calculated metrics
  async getDashboardKPIs(lowStockThreshold: number = 10): Promise<DashboardKPIs> {
    try {
      const dashboardData = await this.getDashboardData(lowStockThreshold);

      // For now, set trend changes to 0 since we don't have historical data
      // In the future, this could compare with previous period data
      return {
        totalProducts: { value: dashboardData.totalProducts, change: 0, trend: 'neutral' },
        lowStockItems: { value: dashboardData.lowStockItems.length, change: 0, trend: 'neutral' },
        totalValue: { value: dashboardData.totalValue, change: 0, trend: 'neutral' },
        categories: { value: dashboardData.categories.length, change: 0, trend: 'neutral' },
        // Mock data for features not yet implemented
        monthlyOrders: { value: 24, change: 12.5, trend: 'up' },
        reorderPoints: { value: 8, change: 15.8, trend: 'up' }
      };
    } catch (error) {
      console.error('Error calculating dashboard KPIs:', error);
      throw error;
    }
  },

  // Get top products by value (inventory value = price * stock)
  async getTopProductsByValue(limit: number = 5): Promise<Item[]> {
    try {
      const allProducts = await productService.getUserProducts();
      return allProducts
        .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top products by value:', error);
      throw error;
    }
  },

  // Get stock distribution by category
  async getStockDistributionByCategory(): Promise<{ [category: string]: { count: number; totalValue: number; totalStock: number } }> {
    try {
      const allProducts = await productService.getUserProducts();
      const distribution: { [category: string]: { count: number; totalValue: number; totalStock: number } } = {};

      allProducts.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!distribution[category]) {
          distribution[category] = { count: 0, totalValue: 0, totalStock: 0 };
        }
        distribution[category].count += 1;
        distribution[category].totalValue += product.price * product.stock;
        distribution[category].totalStock += product.stock;
      });

      return distribution;
    } catch (error) {
      console.error('Error calculating stock distribution:', error);
      throw error;
    }
  },

  // Get mock recent activity (placeholder for future implementation)
  getRecentActivity(): Array<{ action: string; item: string; time: string; type: string }> {
    return [
      { action: 'Stock Update', item: 'Low stock items refreshed', time: '5 min ago', type: 'update' },
      { action: 'Data Sync', item: 'Real inventory data loaded', time: '1 hour ago', type: 'add' },
      { action: 'Low Stock Alert', item: 'Check items below threshold', time: '2 hours ago', type: 'alert' },
      { action: 'Categories Updated', item: 'Product categories synced', time: '3 hours ago', type: 'category' }
    ];
  }
};
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
  low_stock_threshold?: number;  // Threshold personalizado para alerta de estoque baixo
  purchase_price?: number;  // Preço de compra
  sell_price?: number;      // Preço de venda
  barcode?: string;
  image?: string;
  associatedUser: string;  // Note: backend uses 'associatedUser' not 'associatedUsers'
  created_at?: string;
  updated_at?: string;
}

// Create item payload interface for backend
interface CreateItemPayload {
  title: string;
  description?: string;
  category?: string;
  distributer: string;
  unit?: string;
  stock: number;
  low_stock_threshold?: number;
  purchase_price?: number;
  sell_price?: number;
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
  async getLowStockItems(userId: string, defaultThreshold: number = 10): Promise<Item[]> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/items/low-stock`, {
        params: { default_threshold: defaultThreshold }
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

  // Generate QR code for an item
  async generateItemQRCode(itemId: string): Promise<{
    item_id: string;
    barcode?: string;
    qr_code: string;
    title?: string;
    description?: string;
  }> {
    try {
      const response = await apiClient.get(`/api/items/${itemId}/qrcode`);
      return response.data;
    } catch (error) {
      console.error('Error generating QR code for item:', error);
      throw error;
    }
  },

  // Generate QR code for a barcode
  async generateBarcodeQRCode(barcode: string): Promise<{
    barcode: string;
    qr_code: string;
  }> {
    try {
      const response = await apiClient.get(`/api/items/barcode/${barcode}/qrcode`);
      return response.data;
    } catch (error) {
      console.error('Error generating QR code for barcode:', error);
      throw error;
    }
  },

  // Process scanned QR code
  async processQRScan(qrData: string): Promise<{
    type: 'product' | 'barcode' | 'unknown';
    item?: Item;
    data?: string;
    message: string;
  }> {
    try {
      const response = await apiClient.post('/api/items/qr-scan', {
        qr_data: qrData
      });
      
      // Convert item data if present
      if (response.data.item) {
        response.data.item = {
          ...response.data.item,
          name: response.data.item.title,
          id: response.data.item.id || response.data.item._id || String(response.data.item._id)
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error processing QR scan:', error);
      throw error;
    }
  },

  // Create item from QR scan
  async createItemFromQR(itemData: {
    title: string;
    description?: string;
    category?: string;
    distributer: string;
    unit?: string;
    stock: number;
    low_stock_threshold?: number;
    purchase_price?: number;
    sell_price?: number;
    image?: string;
    barcode?: string;
  }, qrData?: string): Promise<Item> {
    try {
      const payload = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        distributer: itemData.distributer,
        unit: itemData.unit,
        stock: itemData.stock,
        low_stock_threshold: itemData.low_stock_threshold,
        purchase_price: itemData.purchase_price,
        sell_price: itemData.sell_price,
        image: itemData.image,
        barcode: itemData.barcode,
        associatedUser: '' // This will be set by the backend
      };

      const response = await apiClient.post('/api/items/create-from-qr', {
        ...payload,
        qr_data: qrData
      });

      return {
        ...response.data,
        name: response.data.title,
        id: response.data.id || response.data._id || String(response.data._id)
      };
    } catch (error) {
      console.error('Error creating item from QR:', error);
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

  // Create a new item
  async createProduct(itemData: {
    name: string;
    description?: string;
    category?: string;
    distributer: string;
    unit?: string;
    stock: number;
    low_stock_threshold?: number;
    purchase_price?: number;
    sell_price?: number;
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
        low_stock_threshold: itemData.low_stock_threshold,
        purchase_price: itemData.purchase_price,
        sell_price: itemData.sell_price,
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
        lowStockItems,
        categories,
        distributors
      ] = await Promise.all([
        productService.getUserProducts(),
        // Use the backend low stock endpoint that respects individual thresholds
        apiClient.get('/api/items/low-stock', {
          params: { default_threshold: lowStockThreshold }
        }).then(res => res.data.map((item: any) => ({
          ...item,
          name: item.title,
          id: item.id || item._id || String(item._id)
        }))),
        // Use fallback if getUserCategories requires userId but we want auth-based
        apiClient.get('/api/categories').then(res => res.data.categories).catch(() => []),
        apiClient.get('/api/distributors').then(res => res.data.distributors).catch(() => [])
      ]);

      // Calculate total inventory value
      const totalValue = allProducts.reduce((sum, product) => {
        const price = product.sell_price || product.purchase_price || 0;
        return sum + (price * product.stock);
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
        .sort((a, b) => {
          const aPrice = a.sell_price || a.purchase_price || 0;
          const bPrice = b.sell_price || b.purchase_price || 0;
          return (bPrice * b.stock) - (aPrice * a.stock);
        })
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
        const price = product.sell_price || product.purchase_price || 0;
        distribution[category].totalValue += price * product.stock;
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

// Stock Transaction Types and Interfaces
export enum StockTransactionType {
  LOSS = "loss",
  DAMAGE = "damage", 
  RETURN = "return"
}

export interface StockTransaction {
  id: string;
  item_id: string;
  transaction_type: StockTransactionType;
  quantity: number;
  reason: string;
  notes?: string;
  cost_impact?: number;
  reference_number?: string;
  associated_user: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateStockTransactionData {
  item_id: string;
  transaction_type: StockTransactionType;
  quantity: number;
  reason: string;
  notes?: string;
  cost_impact?: number;
  reference_number?: string;
}

export interface UpdateStockTransactionData {
  reason?: string;
  notes?: string;
  cost_impact?: number;
  reference_number?: string;
}

export interface StockTransactionStats {
  loss: { quantity: number; cost: number; count: number };
  damage: { quantity: number; cost: number; count: number };
  return: { quantity: number; cost: number; count: number };
  total: { quantity: number; cost: number; count: number };
}

export interface StockTransactionResponse {
  transactions: StockTransaction[];
  total_count: number;
}

// Stock Transaction Service
export const stockTransactionService = {
  // Create new stock transaction
  async createTransaction(data: CreateStockTransactionData): Promise<StockTransaction> {
    try {
      const response = await apiClient.post('/api/stock-transactions/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating stock transaction:', error);
      throw error;
    }
  },

  // Get transactions with filtering and pagination
  async getTransactions(
    transactionType?: StockTransactionType,
    itemId?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<StockTransactionResponse> {
    try {
      const params: any = { skip, limit };
      
      if (transactionType) {
        params.transaction_type = transactionType;
      }
      
      if (itemId) {
        params.item_id = itemId;
      }

      const [transactionsResponse, countResponse] = await Promise.all([
        apiClient.get('/api/stock-transactions/', { params }),
        apiClient.get('/api/stock-transactions/count', { params: { 
          transaction_type: transactionType,
          item_id: itemId 
        }})
      ]);

      return {
        transactions: transactionsResponse.data,
        total_count: countResponse.data.count
      };
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      throw error;
    }
  },

  // Get transaction statistics
  async getTransactionStats(): Promise<StockTransactionStats> {
    try {
      const response = await apiClient.get('/api/stock-transactions/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      throw error;
    }
  },

  // Get specific transaction
  async getTransaction(transactionId: string): Promise<StockTransaction> {
    try {
      const response = await apiClient.get(`/api/stock-transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },

  // Update transaction
  async updateTransaction(transactionId: string, data: UpdateStockTransactionData): Promise<StockTransaction> {
    try {
      const response = await apiClient.put(`/api/stock-transactions/${transactionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  // Get transactions for specific item
  async getItemTransactions(itemId: string, skip: number = 0, limit: number = 100): Promise<StockTransactionResponse> {
    return this.getTransactions(undefined, itemId, skip, limit);
  },

  // Get transactions by type
  async getTransactionsByType(type: StockTransactionType, skip: number = 0, limit: number = 100): Promise<StockTransactionResponse> {
    return this.getTransactions(type, undefined, skip, limit);
  }
};
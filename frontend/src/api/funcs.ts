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
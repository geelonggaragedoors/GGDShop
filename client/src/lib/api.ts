import { apiRequest } from "./queryClient";

// Product API functions
export const api = {
  // Public product endpoints
  products: {
    getAll: (params?: {
      categoryId?: string;
      brandId?: string;
      search?: string;
      featured?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
      if (params?.brandId) searchParams.set('brandId', params.brandId);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.featured) searchParams.set('featured', 'true');
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      
      return fetch(`/api/products?${searchParams}`).then(res => res.json());
    },
    
    getById: (id: string) => 
      fetch(`/api/products/${id}`).then(res => res.json()),
    
    getBySlug: (slug: string) => 
      fetch(`/api/products/slug/${slug}`).then(res => res.json()),
  },

  // Categories
  categories: {
    getAll: () => 
      fetch('/api/categories').then(res => res.json()),
  },

  // Brands
  brands: {
    getAll: () => 
      fetch('/api/brands').then(res => res.json()),
  },

  // Orders
  orders: {
    create: (order: any) => 
      apiRequest('POST', '/api/orders', order),
  },

  // Customers
  customers: {
    create: (customer: any) => 
      apiRequest('POST', '/api/customers', customer),
  },

  // Shipping
  shipping: {
    calculate: (postcode: string, weight: number) => 
      apiRequest('POST', '/api/shipping/calculate', { postcode, weight }),
  },

  // Admin endpoints
  admin: {
    dashboard: {
      getStats: () => 
        fetch('/api/admin/dashboard').then(res => res.json()),
    },

    products: {
      getAll: (params?: {
        search?: string;
        categoryId?: string;
        brandId?: string;
        limit?: number;
        offset?: number;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
        if (params?.brandId) searchParams.set('brandId', params.brandId);
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());
        
        return fetch(`/api/products?${searchParams}`).then(res => res.json());
      },

      create: (product: any) => 
        apiRequest('POST', '/api/admin/products', product),

      update: (id: string, product: any) => 
        apiRequest('PUT', `/api/admin/products/${id}`, product),

      delete: (id: string) => 
        apiRequest('DELETE', `/api/admin/products/${id}`),
    },

    categories: {
      getAll: () => 
        fetch('/api/admin/categories').then(res => res.json()),

      create: (category: any) => 
        apiRequest('POST', '/api/admin/categories', category),

      update: (id: string, category: any) => 
        apiRequest('PUT', `/api/admin/categories/${id}`, category),

      delete: (id: string) => 
        apiRequest('DELETE', `/api/admin/categories/${id}`),
    },

    brands: {
      getAll: () => 
        fetch('/api/admin/brands').then(res => res.json()),

      create: (brand: any) => 
        apiRequest('POST', '/api/admin/brands', brand),

      update: (id: string, brand: any) => 
        apiRequest('PUT', `/api/admin/brands/${id}`, brand),

      delete: (id: string) => 
        apiRequest('DELETE', `/api/admin/brands/${id}`),
    },

    orders: {
      getAll: (params?: {
        status?: string;
        limit?: number;
        offset?: number;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());
        
        return fetch(`/api/admin/orders?${searchParams}`).then(res => res.json());
      },

      updateStatus: (id: string, status: string) => 
        apiRequest('PUT', `/api/admin/orders/${id}/status`, { status }),
    },

    customers: {
      getAll: () => 
        fetch('/api/admin/customers').then(res => res.json()),
    },
  },
};

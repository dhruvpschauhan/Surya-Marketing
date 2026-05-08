import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Products ───
export const searchProducts = (q) => api.get(`/products/search?q=${encodeURIComponent(q)}`);
export const listProducts = (params) => api.get('/products', { params });

export const uploadProducts = (file, adminPassword) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'X-Admin-Password': adminPassword },
  });
};

export const syncProducts = (products, adminPassword) =>
  api.post('/admin/products/sync', products, {
    headers: { 'X-Admin-Password': adminPassword },
  });

// ─── Discounts ───
export const getDiscounts = () => api.get('/admin/discounts');

export const updateDiscounts = (updates, adminPassword) =>
  api.put('/admin/discounts', { updates }, {
    headers: { 'X-Admin-Password': adminPassword },
  });

export const uploadDiscounts = (file, adminPassword) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/discounts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'X-Admin-Password': adminPassword },
  });
};

export const syncDiscounts = (cells, adminPassword) =>
  api.post('/admin/discounts/sync', cells, {
    headers: { 'X-Admin-Password': adminPassword },
  });

// ─── Quotes ───
export const generateQuote = (data) => api.post('/quote/generate', data);

export const getQuoteHistory = (params) => api.get('/quotes/history', { params });

export const getQuoteDetail = (id) => api.get(`/quotes/${id}`);

export const deleteQuote = (id) => api.delete(`/quotes/${id}`);

export const exportQuotePDF = (id) =>
  api.post(`/quote/${id}/export/pdf`, {}, { responseType: 'blob' });

export const exportQuoteExcel = (id) =>
  api.post(`/quote/${id}/export/excel`, {}, { responseType: 'blob' });

// ─── Dealer Profile ───
export const getDealerProfile = () => api.get('/settings/dealer-profile');

export const updateDealerProfile = (data) => api.put('/settings/dealer-profile', data);

export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/settings/dealer-profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── Dealerships ───
export const listDealerships = () => api.get('/settings/dealerships');
export const createDealership = (data) => api.post('/settings/dealerships', data);
export const updateDealership = (id, data) => api.put(`/settings/dealerships/${id}`, data);
export const deleteDealership = (id) => api.delete(`/settings/dealerships/${id}`);

export default api;

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://stockpilot-commerce-api-dcke.vercel.app').replace(/\/$/, '');

let token = localStorage.getItem('stockpilot_token') || '';

export function setToken(value) {
  token = value || '';
  if (token) localStorage.setItem('stockpilot_token', token);
  else localStorage.removeItem('stockpilot_token');
}

export function getToken() { return token; }

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  return data;
}

export const api = {
  health: () => request('/api/health'),
  login: body => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: body => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  products: ({ search = '', category = '', page = 1, limit = 50 } = {}) => {
    const query = new URLSearchParams({ page, limit });
    if (search) query.set('search', search);
    if (category) query.set('category', category);
    return request(`/api/products?${query}`);
  },
  categories: () => request('/api/categories'),
  cart: () => request('/api/cart'),
  addCart: body => request('/api/cart', { method: 'POST', body: JSON.stringify(body) }),
  removeCart: id => request(`/api/cart/${id}`, { method: 'DELETE' }),
  checkout: () => request('/api/orders/checkout', { method: 'POST' }),
  orders: () => request('/api/orders'),
  createProduct: body => request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProduct: id => request(`/api/products/${id}`, { method: 'DELETE' }),
  createCategory: name => request('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

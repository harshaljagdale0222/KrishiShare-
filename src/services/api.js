import axios from 'axios'
import useAuthStore from '../store/authStore'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
})

API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  getProfile: ()   => API.get('/auth/profile'),
}

export const equipmentAPI = {
  getAll:  (params) => API.get('/equipment', { params }),
  getById: (id)     => API.get(`/equipment/${id}`),
  create:  (data)   => API.post('/equipment', data),
}

export const bookingAPI = {
  create:       (data)         => API.post('/bookings', data),
  getMyBookings: ()            => API.get('/bookings/my'),
  updateStatus: (id, status)   => API.patch(`/bookings/${id}`, { status }),
}

export const productAPI = {
  getAll:  (params) => API.get('/products', { params }),
  getById: (id)     => API.get(`/products/${id}`),
}

export const orderAPI = {
  create:      (data) => API.post('/orders', data),
  getMyOrders: ()     => API.get('/orders/my'),
}

export default API

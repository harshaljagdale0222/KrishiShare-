import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api'

// ─── Axios Instance ───────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auto Token attach ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krishi-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
// ─── Response Interceptor ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPath = window.location.pathname.includes('/login') || window.location.pathname.includes('/register')
    
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !isAuthPath) {
      console.error('Session expired or unauthorized access')
      localStorage.removeItem('krishi-token')
      // Instead of wiping everything, just redirect to login if not already there
      window.location.href = '/login?expired=true'
    }
    return Promise.reject(error)
  }
)
// ─── Auth APIs ────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  googleLogin: (idToken) => api.post('/auth/google-login', { idToken }),
  sendOTP:   (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  getMe:    ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteProfile: ()     => api.delete('/auth/profile'),
  getByRole: (role) => api.get(`/auth/role/${role}`),
  getAllUsers: () => api.get('/auth/all-users'),
  updateUserRole: (id, role) => api.patch(`/auth/update-role/${id}`, { role }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
}

// ─── Harvest APIs ─────────────────────────────────────────
export const harvestAPI = {
  postRequest:    (data) => api.post('/harvest', data),
  getMyRequests:  ()     => api.get('/harvest/my'),
  getForFactory:  ()     => api.get('/harvest/factory'),
  updateStatus:   (id, data) => api.put(`/harvest/${id}`, data),
  generateSlip:   (id, data) => api.post(`/harvest/${id}/slip`, data),
  cancelRequest:  (id) => api.delete(`/harvest/${id}`),
  submitRequest: (data) => api.post('/harvest/request', data),
  getFarmerRequests: () => api.get('/harvest/farmer'),
  getFactoryRequests: () => api.get('/harvest/factory'),
  acceptRequest: (id) => api.put(`/harvest/accept/${id}`),
  finalizeFactory: (id, factoryId) => api.put(`/harvest/finalize/${id}`, { factoryId })
}

// ─── Order APIs ───────────────────────────────────────────
export const orderAPI = {
  placeOrder:    (data) => api.post('/orders', data),
  getMyOrders:   ()     => api.get('/orders/my'),
  getAllOrders:   ()     => api.get('/orders/all'),
  updateStatus:  (id, data) => api.put(`/orders/${id}`, data),
  updateLocation:(id, data) => api.put(`/orders/${id}/location`, data),
  payAdvance:    (id) => api.patch(`/orders/${id}/pay-advance`),
  payBalance:    (id) => api.patch(`/orders/${id}/pay-balance`),
  cancelOrder:   (id) => api.patch(`/orders/${id}/cancel`),
  generateBill:  (id) => api.patch(`/orders/${id}/bill-generated`),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
  updateReturnStatus: (id, status) => api.patch(`/orders/${id}/return-status`, { status }),
}

// ─── Factory APIs ─────────────────────────────────────────
export const factoryAPI = {
  getAll: (district) => api.get('/factories', { params: { district } }),
  applyMembership: (fId, data) => api.post(`/factories/${fId}/apply-membership`, data),
  getMyMemberships: () => api.get('/factories/my-memberships'),
  getApplications: (fId) => api.get(`/factories/${fId}/applications`),
  create: (data) => api.post('/factories', data),
  delete: (id) => api.delete(`/factories/${id}`)
}

// ─── Product APIs ─────────────────────────────────────────
export const productAPI = {
  getAll:      () => api.get('/products'),
  getForOwner: () => api.get('/products/owner'),
  create:      (data) => api.post('/products', data),
  update:      (id, data) => api.put(`/products/${id}`, data),
  remove:      (id) => api.delete(`/products/${id}`),
  rate:        (id, data) => api.post(`/products/${id}/rate`, data),
}

// ─── Complaint APIs ───────────────────────────────────────
export const complaintAPI = {
  getAll: () => api.get('/complaints'),
  create: (data) => api.post('/complaints', data),
  getFarmerComplaints: () => api.get('/complaints/my'),
  getBusinessComplaints: () => api.get('/complaints/factory'),
  updateStatus: (id, status) => api.put(`/complaints/${id}`, { status })
}

// ─── Equipment APIs ───────────────────────────────────────
export const equipmentAPI = {
  getAll: (params) => api.get('/equipments', { params }),
  getMy: () => api.get('/equipments/my'),
  create: (data) => api.post('/equipments', data),
  update: (id, data) => api.put(`/equipments/${id}`, data),
  delete: (id) => api.delete(`/equipments/${id}`),
}

// ─── Booking APIs ──────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getAllBookings: () => api.get('/bookings/all'),
  updateStatus: (id, status) => api.put(`/bookings/${id}`, { status }),
  updateLocation: (id, data) => api.put(`/bookings/${id}/location`, data),
  updatePaymentStatus: (id, status) => api.patch(`/bookings/${id}/payment`, { status }),
  cancelBooking: (id) => api.patch(`/bookings/${id}/cancel`),
  getAvailability: (equipmentId) => api.get(`/bookings/availability/${equipmentId}`),
  rate: (id, data) => api.post(`/bookings/${id}/rate`, data),
  reportFarmer: (id) => api.post(`/bookings/${id}/report`),
  confirmAdvance: (id) => api.patch(`/bookings/${id}/confirm-advance`),
  reportOwner: (id) => api.post(`/bookings/${id}/report-owner`),
}

// ─── Notification APIs ────────────────────────────────────
export const notificationAPI = {
  getAll:  ()   => api.get('/notifications'),
  readOne: (id) => api.put(`/notifications/${id}/read`),
  readAll: ()   => api.put('/notifications/readall'),
}

// ─── Payment APIs ──────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify:      (data) => api.post('/payments/verify', data),
}

// ─── Scheme APIs ───────────────────────────────────────────
export const schemeAPI = {
  getAll: () => api.get('/schemes'),
  create: (data) => api.post('/schemes', data),
  delete: (id) => api.delete(`/schemes/${id}`),
}

export default api
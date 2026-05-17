import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      loading:         false,

      register: async (data) => {
        set({ loading: true })
        try {
          const res = await authAPI.register(data)
          const { token, ...backendUser } = res.data
          // Merge input data with backend response to ensure local state is complete
          const user = { ...data, ...backendUser }
          localStorage.setItem('krishi-token', token)
          set({ user, token, isAuthenticated: true, loading: false })
          toast.success('Registration successful! 🎉')
          return { success: true, role: user.role, user }
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Registration failed!')
          return { success: false }
        }
      },

      login: async (email, password) => {
        set({ loading: true })
        try {
          const res = await authAPI.login({ email, password })
          const { token, ...user } = res.data
          localStorage.setItem('krishi-token', token)
          set({ user, token, isAuthenticated: true, loading: false })
          toast.success(`Welcome back, ${user.name}! 🌾`)
          return { success: true, role: user.role, user }
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Login failed!')
          return { success: false }
        }
      },

      googleLogin: async (idToken) => {
        set({ loading: true })
        try {
          const res = await authAPI.googleLogin(idToken)
          const { token, ...user } = res.data
          localStorage.setItem('krishi-token', token)
          set({ user, token, isAuthenticated: true, loading: false })
          toast.success(`Google login successful!`)
          return { success: true, role: user.role, user }
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Google Auth failed!')
          return { success: false }
        }
      },

      sendOTP: async (email) => {
        set({ loading: true })
        try {
          await authAPI.sendOTP(email)
          set({ loading: false })
          toast.success('OTP sent successfully! 📱')
          return true
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Failed to send OTP')
          return false
        }
      },

      verifyOTP: async (email, otp) => {
        set({ loading: true })
        try {
          const res = await authAPI.verifyOTP(email, otp)
          const { token, ...user } = res.data
          localStorage.setItem('krishi-token', token)
          set({ user, token, isAuthenticated: true, loading: false })
          toast.success('OTP Verified!')
          return { success: true, role: user.role, user }
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Invalid or expired OTP')
          return { success: false }
        }
      },

      logout: () => {
        localStorage.removeItem('krishi-token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: async (data) => {
        try {
          const res = await authAPI.updateProfile(data)
          set({ user: res.data })
          toast.success('Profile updated!')
          return { success: true }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Update failed!')
          throw err
        }
      },

      deleteAccount: async () => {
        set({ loading: true })
        try {
          await authAPI.deleteProfile()
          localStorage.removeItem('krishi-token')
          set({ user: null, token: null, isAuthenticated: false, loading: false })
          toast.success('Account deleted successfully! 🙏')
          return true
        } catch (err) {
          set({ loading: false })
          toast.error(err.response?.data?.message || 'Failed to delete account')
          return false
        }
      },

      getDashboardRoute: () => {
        const { user } = get()
        const ownerRoles = ['equipment_owner', 'mart_owner', 'factory_owner']
        if (ownerRoles.includes(user?.role)) return '/store-dashboard'
        return '/dashboard'
      },

      isOwner:  () => ['equipment_owner', 'mart_owner', 'factory_owner'].includes(get().user?.role),
      isFarmer: () => get().user?.role === 'farmer',
    }),
    {
      name: 'krishi-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
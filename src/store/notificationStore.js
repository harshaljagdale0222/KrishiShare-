import { create } from 'zustand'
import { notificationAPI } from '../api'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await notificationAPI.getAll()
      set({ 
        notifications: res.data,
        unreadCount: res.data.filter(n => !n.isRead).length
      })
    } catch (e) {}
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
  },

  markAsRead: async (id) => {
    try {
      await notificationAPI.readOne(id)
      set((state) => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (e) {}
  },

  markAllRead: async () => {
    try {
      await notificationAPI.readAll()
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))
    } catch (e) {}
  }
}))

export default useNotificationStore

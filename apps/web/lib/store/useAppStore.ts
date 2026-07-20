/**
 * OGMJ BRANDS — Global State Store (Zustand)
 * Centralized application state management
 * Last Updated: July 1, 2026
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

// ================================
// STATE INTERFACES
// ================================

export interface Business {
  id: string
  name: string
  logo_url?: string
  status: string
  subscription_plan?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setIsLoading: (loading: boolean) => void
}

export interface BusinessState {
  currentBusiness: Business | null
  businesses: Business[]
  setCurrentBusiness: (business: Business | null) => void
  setBusinesses: (businesses: Business[]) => void
  addBusiness: (business: Business) => void
}

export interface UIState {
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
  }>
  setTheme: (theme: 'dark' | 'light') => void
  toggleSidebar: () => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
}

export type AppState = AuthState & BusinessState & UIState

// ================================
// STORE CREATION
// ================================

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // ── AUTH STATE ──────────────────────────────────────────
        user: null,
        isLoading: true,
        isAuthenticated: false,

        setUser: (user: User | null) =>
          set({
            user,
            isAuthenticated: !!user,
          }),

        setIsLoading: (isLoading: boolean) => set({ isLoading }),

        // ── BUSINESS STATE ──────────────────────────────────────
        currentBusiness: null,
        businesses: [],

        setCurrentBusiness: (currentBusiness: Business | null) =>
          set({ currentBusiness }),

        setBusinesses: (businesses: Business[]) => set({ businesses }),

        addBusiness: (business: Business) =>
          set((state) => ({
            businesses: [...state.businesses, business],
          })),

        // ── UI STATE ────────────────────────────────────────────
        theme: 'dark',
        sidebarOpen: true,
        notifications: [],

        setTheme: (theme: 'dark' | 'light') => set({ theme }),

        toggleSidebar: () =>
          set((state) => ({
            sidebarOpen: !state.sidebarOpen,
          })),

        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
              },
            ],
          })),

        removeNotification: (id: string) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
      }),
      {
        name: 'ogmj-app-store',
        partialize: (state) => ({
          // Only persist theme and sidebar preference
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
)

// ================================
// STORE HOOKS (OPTIONAL)
// ================================

// Auth hooks
export const useAuth = () =>
  useAppStore((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    setUser: state.setUser,
    setIsLoading: state.setIsLoading,
  }))

// Business hooks
export const useBusiness = () =>
  useAppStore((state) => ({
    currentBusiness: state.currentBusiness,
    businesses: state.businesses,
    setCurrentBusiness: state.setCurrentBusiness,
    setBusinesses: state.setBusinesses,
    addBusiness: state.addBusiness,
  }))

// UI hooks
export const useUI = () =>
  useAppStore((state) => ({
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
    notifications: state.notifications,
    setTheme: state.setTheme,
    toggleSidebar: state.toggleSidebar,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
  }))


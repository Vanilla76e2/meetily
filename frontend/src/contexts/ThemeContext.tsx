'use client'

import { createContext, useContext } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export const THEME_STORAGE_KEY = 'meetily-theme'
export type ThemeMode = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  document.documentElement.style.colorScheme = theme
  try {
    void getCurrentWindow().setTheme(theme).catch((error) => {
      console.warn('Failed to set window theme:', error)
    })
  } catch (error) {
    console.warn('Window theme is unavailable:', error)
  }
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) {
    return {
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
    }
  }
  return value
}

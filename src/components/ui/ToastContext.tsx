'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastContainer, ToastType } from './Toast'

interface ToastItem { id: string; type: ToastType; message: string; action?: { label: string; onClick: () => void } }

interface ToastContextValue {
  toast: {
    success: (message: string, action?: ToastItem['action']) => void
    error: (message: string, action?: ToastItem['action']) => void
    warning: (message: string, action?: ToastItem['action']) => void
    info: (message: string, action?: ToastItem['action']) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((type: ToastType, message: string, action?: ToastItem['action']) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, type, message, action }])
  }, [])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg: string, action?: ToastItem['action']) => add('success', msg, action),
    error: (msg: string, action?: ToastItem['action']) => add('error', msg, action),
    warning: (msg: string, action?: ToastItem['action']) => add('warning', msg, action),
    info: (msg: string, action?: ToastItem['action']) => add('info', msg, action),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

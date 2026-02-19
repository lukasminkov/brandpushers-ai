'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

const config: Record<ToastType, { icon: typeof CheckCircle; color: string; bar: string }> = {
  success: { icon: CheckCircle, color: 'text-green-400', bar: 'bg-green-400' },
  error:   { icon: XCircle,     color: 'text-red-400',   bar: 'bg-red-400' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bar: 'bg-yellow-400' },
  info:    { icon: Info,         color: 'text-blue-400',  bar: 'bg-blue-400' },
}

const DURATION = 4000

interface ToastProps {
  id: string; type: ToastType; message: string
  action?: { label: string; onClick: () => void }
  onRemove: (id: string) => void
}

function ToastItem({ id, type, message, action, onRemove }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const { icon: Icon, color, bar } = config[type]

  useEffect(() => {
    const start = Date.now()
    const frame = () => {
      const elapsed = Date.now() - start
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(pct)
      if (pct > 0) requestAnimationFrame(frame)
      else onRemove(id)
    }
    const raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [id, onRemove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl min-w-[300px] max-w-[420px]"
    >
      <div className="flex items-start gap-3 p-3 pr-9">
        <Icon size={18} className={`${color} mt-0.5 shrink-0`} />
        <p className="text-sm text-white/90 leading-snug flex-1">{message}</p>
        {action && (
          <button onClick={action.onClick} className={`text-xs font-medium ${color} hover:underline shrink-0`}>
            {action.label}
          </button>
        )}
      </div>
      <button onClick={() => onRemove(id)} className="absolute top-2.5 right-2.5 text-white/40 hover:text-white/70 transition-colors">
        <X size={14} />
      </button>
      <div className="h-[2px] w-full bg-white/5">
        <div className={`h-full ${bar} transition-none`} style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  )
}

interface ContainerProps {
  toasts: { id: string; type: ToastType; message: string; action?: { label: string; onClick: () => void } }[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export { ToastItem as Toast }

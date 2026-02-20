'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plug, ShoppingBag, RefreshCw, Trash2, ExternalLink, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'

interface TikTokConnection {
  id: string
  shop_id: string | null
  shop_name: string | null
  shop_cipher: string | null
  region: string
  connected_at: string
  last_sync_at: string | null
  sync_status: string
  sync_error: string | null
  token_expires_at: string
}

// Future integrations placeholder
const UPCOMING_INTEGRATIONS = [
  { name: 'Amazon Seller Central', icon: '📦', description: 'Sync orders, fees, and FBA data', status: 'coming_soon' as const },
  { name: 'Shopify', icon: '🛒', description: 'Connect your Shopify store for order sync', status: 'coming_soon' as const },
]

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<TikTokConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  const loadConnections = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tiktok_connections')
      .select('id, shop_id, shop_name, shop_cipher, region, connected_at, last_sync_at, sync_status, sync_error, token_expires_at')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false })

    setConnections((data || []) as TikTokConnection[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadConnections()

    // Check URL params for connection result
    const params = new URLSearchParams(window.location.search)
    if (params.get('tiktok') === 'connected') {
      setSuccess('TikTok Shop connected successfully!')
      window.history.replaceState({}, '', '/dashboard/integrations')
      loadConnections()
    } else if (params.get('error') === 'tiktok_auth_failed') {
      setError('Failed to connect TikTok Shop. Please try again.')
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
  }, [loadConnections])

  // Auto-dismiss messages
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 5000); return () => clearTimeout(t) }
  }, [success])
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 8000); return () => clearTimeout(t) }
  }, [error])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/tiktok/auth')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to get authorization URL')
        setConnecting(false)
      }
    } catch {
      setError('Failed to initiate TikTok connection')
      setConnecting(false)
    }
  }

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId)
    setError(null)
    try {
      const res = await fetch('/api/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, syncType: 'all' }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(`Synced: ${data.results.orders || 0} orders, ${data.results.products || 0} products, ${data.results.affiliate_orders || 0} affiliate orders`)
        loadConnections()
      } else {
        setError(data.error || 'Sync failed')
      }
    } catch {
      setError('Sync request failed')
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Disconnect this TikTok Shop? Synced data will be preserved.')) return
    setDisconnecting(connectionId)
    try {
      const { error: err } = await supabase
        .from('tiktok_connections')
        .delete()
        .eq('id', connectionId)
      if (err) throw err
      setConnections(prev => prev.filter(c => c.id !== connectionId))
      setSuccess('TikTok Shop disconnected')
    } catch {
      setError('Failed to disconnect')
    } finally {
      setDisconnecting(null)
    }
  }

  const tokenStatus = (conn: TikTokConnection) => {
    const expires = new Date(conn.token_expires_at)
    const now = new Date()
    if (expires < now) return 'expired'
    if (expires.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'expiring'
    return 'valid'
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Plug size={20} style={{ color: '#F24822' }} />
          Integrations
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your e-commerce accounts to auto-sync data across all tools.
        </p>
      </div>

      {/* Status messages */}
      {success && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
          <CheckCircle size={15} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* TikTok Shop Section */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
              🛍️
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">TikTok Shop</h2>
              <p className="text-xs text-gray-500">Orders, affiliates, settlements & products</p>
            </div>
          </div>
          {connections.length === 0 && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={{ background: '#F24822' }}
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {connecting ? 'Redirecting…' : 'Connect'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-500" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingBag size={28} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-500">No TikTok Shop connected</p>
            <p className="text-xs text-gray-600 mt-1">Connect your shop to auto-sync data to The Bible and other tools.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => {
              const ts = tokenStatus(conn)
              return (
                <div key={conn.id} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${ts === 'valid' ? 'bg-green-500' : ts === 'expiring' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {conn.shop_name || 'TikTok Shop'}
                        {conn.region && <span className="ml-1.5 text-[10px] font-normal text-gray-500 uppercase">{conn.region}</span>}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span>Connected {new Date(conn.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {conn.last_sync_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Last sync {new Date(conn.last_sync_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {conn.sync_error && <span className="text-red-400">Error: {conn.sync_error}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => handleSync(conn.id)}
                      disabled={syncing === conn.id}
                      title="Sync now"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {syncing === conn.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                    <button
                      onClick={() => handleDisconnect(conn.id)}
                      disabled={disconnecting === conn.id}
                      title="Disconnect"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {disconnecting === conn.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
            {/* Add another shop */}
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-2.5 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-dashed transition-all cursor-pointer disabled:opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              + Connect another shop
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Integrations */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Coming Soon</h3>
        {UPCOMING_INTEGRATIONS.map(int => (
          <div key={int.name} className="rounded-2xl px-5 py-4 flex items-center justify-between opacity-50" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {int.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{int.name}</p>
                <p className="text-xs text-gray-600">{int.description}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}

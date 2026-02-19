'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ExternalLink, FileText, File, Link2, Video } from 'lucide-react'
import TiptapRenderer from './TiptapRenderer'
import { useEffect, useState } from 'react'

interface ResourceLink {
  title: string
  url: string
  type: string
}

interface Step {
  id: string
  title: string
  content: Record<string, unknown> | null
  video_url: string | null
  resource_links: ResourceLink[] | null
}

interface StepModalProps {
  step: Step | null
  onClose: () => void
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname === 'youtu.be') {
      id = u.pathname.slice(1)
    } else if (u.searchParams.get('v')) {
      id = u.searchParams.get('v')!
    }
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}

const typeIcon: Record<string, React.ReactNode> = {
  pdf: <FileText size={14} />,
  video: <Video size={14} />,
  doc: <File size={14} />,
  template: <FileText size={14} />,
  link: <Link2 size={14} />,
}

const typeColor: Record<string, string> = {
  pdf: 'bg-red-500/20 text-red-400',
  video: 'bg-blue-500/20 text-blue-400',
  doc: 'bg-yellow-500/20 text-yellow-400',
  template: 'bg-purple-500/20 text-purple-400',
  link: 'bg-gray-500/20 text-gray-400',
}

export default function StepModal({ step, onClose }: StepModalProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (step?.video_url) {
      setEmbedUrl(getYoutubeEmbedUrl(step.video_url))
    } else {
      setEmbedUrl(null)
    }
  }, [step])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {step && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Panel — slides in from the right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0F0F0F] border-l border-white/10 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold truncate pr-4">{step.title}</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition text-gray-400 hover:text-white flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Video Player */}
              {embedUrl && (
                <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Direct video URL (non-youtube) */}
              {step.video_url && !embedUrl && (
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center">
                    <Play size={18} className="text-brand-orange" />
                  </div>
                  <a href={step.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline text-sm">
                    Watch Video <ExternalLink size={12} className="inline ml-1" />
                  </a>
                </div>
              )}

              {/* Rich Text Content */}
              {step.content && (
                <div className="glass rounded-2xl p-6">
                  <TiptapRenderer content={step.content} />
                </div>
              )}

              {/* Resource Links */}
              {step.resource_links && step.resource_links.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Resources</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {step.resource_links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass rounded-xl p-3 flex items-start gap-3 hover:bg-white/10 transition group"
                      >
                        <div className={`flex-shrink-0 p-1.5 rounded-lg ${typeColor[link.type] || typeColor.link}`}>
                          {typeIcon[link.type] || typeIcon.link}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{link.title || 'Resource'}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{link.type}</p>
                        </div>
                        <ExternalLink size={12} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!step.content && !step.video_url && (!step.resource_links || step.resource_links.length === 0) && (
                <div className="text-center text-gray-600 py-12">
                  <p>No content for this step yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

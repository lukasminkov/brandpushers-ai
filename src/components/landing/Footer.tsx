'use client'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-lg font-black tracking-tight">
            <span className="gradient-text">Brand</span>
            <span className="text-white">Pushers</span>
          </span>
          <span className="text-sm text-gray-500">We build brands with you, not for you.</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
          <a href="/terms" className="hover:text-white transition">Terms of Service</a>
          <a href="https://calendly.com/brandpushers" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Book a Call</a>
        </div>

        <span className="text-xs text-gray-600">© 2026 WHUT.AI LLC</span>
      </div>
    </footer>
  )
}

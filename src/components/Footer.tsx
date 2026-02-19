import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="BrandPushers" width={28} height={28} />
            <span className="font-bold bg-logo-gradient bg-clip-text text-transparent">BrandPushers</span>
          </div>
          <p className="text-xs text-gray-600">Brand Accelerator &amp; Equity Partner</p>
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <a href="https://calendly.com/brandpushers" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Book a Call</a>
        </div>
        <p className="text-sm text-gray-600">© {new Date().getFullYear()} WHUT.AI LLC. All rights reserved.</p>
      </div>
    </footer>
  )
}

import { redirect } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Journey from '@/components/landing/Journey'
import Stats from '@/components/landing/Stats'
import WhyUs from '@/components/landing/WhyUs'
import ContactForm from '@/components/landing/ContactForm'
import Footer from '@/components/landing/Footer'

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <Hero />
      <Journey />
      <Stats />
      <WhyUs />
      <ContactForm />
      <Footer />
    </main>
  )
}

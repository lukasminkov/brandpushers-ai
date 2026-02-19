import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Journey from '@/components/landing/Journey'
import WhyUs from '@/components/landing/WhyUs'
import Stats from '@/components/landing/Stats'
import ContactForm from '@/components/landing/ContactForm'
import Footer from '@/components/landing/Footer'

export default function Home() {
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

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import WhatWeDo from '@/components/WhatWeDo'
import WhyUs from '@/components/WhyUs'
import ApplicationForm from '@/components/ApplicationForm'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">
      <Navbar />
      <Hero />
      <WhatWeDo />
      <WhyUs />
      <ApplicationForm />
      <Footer />
    </main>
  )
}

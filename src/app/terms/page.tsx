import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen py-20 px-6 max-w-3xl mx-auto">
      <Link href="/" className="text-brand-orange hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
        <p>Last updated: February 2026</p>
        <p>These Terms of Service govern your use of brandpushers.ai operated by WHUT.AI LLC (&quot;BrandPushers&quot;).</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Acceptance</h2>
        <p>By accessing or using our platform, you agree to these terms. If you do not agree, do not use our services.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Services</h2>
        <p>BrandPushers provides brand incubation services including strategy, content creation, and growth management. Acceptance into our program is at our sole discretion.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Equity & Payments</h2>
        <p>Specific equity arrangements and payment terms are outlined in individual agreements signed upon acceptance into the program. These terms supplement this general Terms of Service.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Intellectual Property</h2>
        <p>Content created during the program is subject to the terms of your individual agreement. The BrandPushers platform, brand, and technology remain our property.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Limitation of Liability</h2>
        <p>BrandPushers is provided &quot;as is.&quot; We are not liable for indirect, incidental, or consequential damages arising from your use of our services.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Governing Law</h2>
        <p>These terms are governed by the laws of the State of Wyoming, United States.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Contact</h2>
        <p>WHUT.AI LLC<br/>Wyoming, United States<br/>Email: minkovgroup@gmail.com</p>
      </div>
    </div>
  )
}

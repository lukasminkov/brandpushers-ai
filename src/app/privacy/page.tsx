import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20 px-6 max-w-3xl mx-auto">
      <Link href="/" className="text-brand-orange hover:underline mb-8 inline-block">← Back</Link>
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
        <p>Last updated: February 2026</p>
        <p>WHUT.AI LLC (&quot;BrandPushers,&quot; &quot;we,&quot; &quot;us&quot;) operates brandpushers.ai. This Privacy Policy explains how we collect, use, and protect your information.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Information We Collect</h2>
        <p>We collect information you provide when applying to our program, including your name, email address, brand details, and any documents you upload. We also collect usage data through cookies and analytics.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">How We Use Your Information</h2>
        <p>We use your information to: process applications, provide our incubator services, communicate with you, improve our platform, and comply with legal obligations.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Data Sharing</h2>
        <p>We do not sell your personal information. We may share data with service providers (hosting, analytics) who assist in operating our platform, subject to confidentiality agreements.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Data Security</h2>
        <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Your Rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data by contacting us at minkovgroup@gmail.com.</p>
        
        <h2 className="text-2xl font-bold text-white mt-8">Contact</h2>
        <p>WHUT.AI LLC<br/>Wyoming, United States<br/>Email: minkovgroup@gmail.com</p>
      </div>
    </div>
  )
}

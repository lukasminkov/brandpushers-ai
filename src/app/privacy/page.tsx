import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — BrandPushers',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-brand-orange hover:underline mb-10 inline-block text-sm">← Back to Home</Link>

        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: February 19, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              WHUT.AI LLC, a Wyoming limited liability company doing business as <strong className="text-white">BrandPushers</strong>
              {' '}("BrandPushers," "we," "us," or "our"), operates the website{' '}
              <a href="https://brandpushers.ai" className="text-brand-orange hover:underline">brandpushers.ai</a>{' '}
              and the services accessible through it (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit our Platform or apply to our brand accelerator program.
            </p>
            <p className="mt-4">
              By accessing or using our Platform, you consent to the practices described in this Privacy Policy. If you do not agree, please discontinue use of the Platform.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-white mb-2">1.1 Information You Provide Directly</h3>
            <p>When you fill out our application form, create an account, or communicate with us, we may collect:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 ml-4">
              <li>Full name and email address</li>
              <li>Brand name, concept, and stage of development</li>
              <li>Business or personal social media handles</li>
              <li>Revenue, funding, and market information you share</li>
              <li>Documents you upload (pitch decks, operating agreements, etc.)</li>
              <li>Any other information you voluntarily provide in forms or correspondence</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.2 Automatically Collected Information</h3>
            <p>When you visit our Platform, we automatically collect:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 ml-4">
              <li>IP address and general geographic location</li>
              <li>Browser type, device type, and operating system</li>
              <li>Pages visited, time spent on pages, and referring URLs</li>
              <li>Cookie and tracking data (see Section 4)</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">1.3 Information from Third Parties</h3>
            <p>We may receive information about you from third-party services you connect, including scheduling platforms (Calendly) and payment processors when you engage with our paid program.</p>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-3 space-y-1 ml-4">
              <li>Process and evaluate your application to our accelerator program</li>
              <li>Provide, maintain, and improve our Platform and services</li>
              <li>Communicate with you about your application, program status, or account</li>
              <li>Schedule calls and meetings through our scheduling integrations</li>
              <li>Process payments and manage program fee arrangements</li>
              <li>Send program updates, resources, and relevant communications</li>
              <li>Analyze usage to improve our Platform experience</li>
              <li>Comply with applicable laws, regulations, and legal obligations</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
            </ul>
          </section>

          {/* 3. Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage and Security</h2>
            <p>
              Your data is stored in Supabase, a cloud-based database and backend platform hosted on secure infrastructure with encryption at rest and in transit. We implement industry-standard technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="mt-4">
              While we take data security seriously, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          {/* 4. Cookies and Analytics */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies and Analytics</h2>
            <p>We use cookies and similar technologies to operate and improve our Platform. Types of cookies we use:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Essential cookies:</strong> Required for the Platform to function, including authentication session tokens.</li>
              <li><strong className="text-white">Analytics cookies:</strong> Help us understand how visitors interact with the Platform so we can improve the experience. These may be set by third-party analytics providers.</li>
              <li><strong className="text-white">Preference cookies:</strong> Remember your settings and preferences.</li>
            </ul>
            <p className="mt-4">
              Most browsers allow you to control cookies through their settings. Disabling essential cookies may impair Platform functionality.
            </p>
          </section>

          {/* 5. Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Supabase:</strong> Database hosting, authentication, and file storage. <a href="https://supabase.com/privacy" className="text-brand-orange hover:underline">Privacy Policy</a></li>
              <li><strong className="text-white">Calendly:</strong> Meeting scheduling when you book a call with us. <a href="https://calendly.com/privacy" className="text-brand-orange hover:underline">Privacy Policy</a></li>
              <li><strong className="text-white">Payment Processor:</strong> If you participate in our paid program, payment information is processed by our payment provider and is not stored on our servers.</li>
              <li><strong className="text-white">Vercel:</strong> Website hosting and edge delivery.</li>
            </ul>
            <p className="mt-4">
              Each third-party service has its own privacy policy. We are not responsible for the privacy practices of third parties.
            </p>
          </section>

          {/* 6. Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Sharing and Disclosure</h2>
            <p>We do not sell, rent, or trade your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Service Providers:</strong> Trusted vendors who help operate our Platform (hosting, analytics, payments) under confidentiality agreements.</li>
              <li><strong className="text-white">Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with appropriate notice to you.</li>
              <li><strong className="text-white">Protection of Rights:</strong> To protect the rights, property, or safety of BrandPushers, our members, or the public.</li>
            </ul>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Application data from applicants not accepted into the program is retained for up to 2 years. Program participant data is retained for the duration of our business relationship and for at least 5 years thereafter for legal and business record purposes.
            </p>
          </section>

          {/* 8. CCPA */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
              <li><strong className="text-white">Right to Delete:</strong> Request deletion of your personal information, subject to certain exceptions.</li>
              <li><strong className="text-white">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
              <li><strong className="text-white">Right to Opt-Out of Sale:</strong> We do not sell personal information.</li>
            </ul>
            <p className="mt-4">To exercise these rights, contact us at <a href="mailto:hello@brandpushers.ai" className="text-brand-orange hover:underline">hello@brandpushers.ai</a>. We will respond within 45 days.</p>
          </section>

          {/* 9. GDPR */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. European Privacy Rights (GDPR)</h2>
            <p>
              If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have the following rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li><strong className="text-white">Right of Access:</strong> Obtain a copy of the personal data we hold about you.</li>
              <li><strong className="text-white">Right to Rectification:</strong> Correct inaccurate or incomplete personal data.</li>
              <li><strong className="text-white">Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong className="text-white">Right to Restrict Processing:</strong> Request that we limit how we use your data.</li>
              <li><strong className="text-white">Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong className="text-white">Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
            </ul>
            <p className="mt-4">
              Our lawful basis for processing personal data includes: your consent (e.g., submitting an application), performance of a contract (e.g., providing program services), legitimate interests (e.g., improving our Platform), and compliance with legal obligations.
            </p>
            <p className="mt-4">To exercise your GDPR rights, contact us at <a href="mailto:hello@brandpushers.ai" className="text-brand-orange hover:underline">hello@brandpushers.ai</a>. You also have the right to lodge a complaint with your local data protection authority.</p>
          </section>

          {/* 10. Children */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
            <p>
              Our Platform is not directed at children under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us and we will promptly delete it.
            </p>
          </section>

          {/* 11. Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy with a new "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
            <div className="mt-4 glass rounded-xl p-6 border border-white/10">
              <p className="font-semibold text-white">WHUT.AI LLC (BrandPushers)</p>
              <p className="mt-1">Wyoming, United States</p>
              <p className="mt-1">Email: <a href="mailto:hello@brandpushers.ai" className="text-brand-orange hover:underline">hello@brandpushers.ai</a></p>
              <p className="mt-1">Website: <a href="https://brandpushers.ai" className="text-brand-orange hover:underline">brandpushers.ai</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

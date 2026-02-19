import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — BrandPushers',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link href="/" className="text-brand-orange hover:underline mb-10 inline-block text-sm">← Back to Home</Link>

        <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: February 19, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("Participant," "you," or "your") and <strong className="text-white">WHUT.AI LLC</strong>, a Wyoming limited liability company doing business as <strong className="text-white">BrandPushers</strong> ("BrandPushers," "we," "us," or "our"). By accessing our website at{' '}
              <a href="https://brandpushers.ai" className="text-brand-orange hover:underline">brandpushers.ai</a>
              {' '}or participating in our accelerator program, you agree to be bound by these Terms.
            </p>
            <p className="mt-4">
              <strong className="text-white">PLEASE READ THESE TERMS CAREFULLY.</strong> If you do not agree to these Terms, do not use our Platform or apply to our program.
            </p>
          </section>

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the BrandPushers Platform, submitting an application, creating an account, or entering into a program agreement with us, you acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-brand-orange hover:underline">Privacy Policy</Link>, which is incorporated herein by reference.
            </p>
            <p className="mt-4">
              You represent that you are at least 18 years of age and have the legal authority to enter into these Terms on behalf of yourself or any business entity you represent.
            </p>
          </section>

          {/* 2. Program Description */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. The BrandPushers Accelerator Program</h2>
            <p>BrandPushers operates a brand accelerator and equity partnership program designed to help founders build, launch, and scale consumer brands. The Program includes:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Access to a structured, phased brand-building curriculum and course materials</li>
              <li>One-on-one and group mentorship from the BrandPushers team</li>
              <li>AI-assisted brand strategy, content frameworks, and launch resources</li>
              <li>TikTok Shop and social commerce guidance and channel development</li>
              <li>Ongoing operational support throughout agreed program phases</li>
              <li>Access to the BrandPushers member portal and community resources</li>
            </ul>
            <p className="mt-4">
              Admission to the Program is at the sole discretion of BrandPushers. Submission of an application does not guarantee acceptance. We reserve the right to decline any application without explanation.
            </p>
          </section>

          {/* 3. Program Fee */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Program Fee</h2>
            <p>
              Participation in the BrandPushers Accelerator Program requires payment of a program fee determined on a case-by-case basis, generally ranging from <strong className="text-white">$10,000 to $20,000 USD</strong> (or as otherwise specified in your individual program agreement). The exact fee will be disclosed and agreed upon in writing before you are admitted to the Program.
            </p>
            <p className="mt-4">
              The program fee is due in full (or according to a payment schedule specified in your agreement) before or upon program commencement. We accept payment methods as specified in your individual program agreement, which may include wire transfer, ACH, or other payment methods.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">3.1 Non-Refundable Policy</h3>
            <p>
              <strong className="text-white">ALL PROGRAM FEES ARE NON-REFUNDABLE ONCE THE PROGRAM HAS COMMENCED.</strong> "Commencement" means the date on which you are given access to program materials, the member portal, or any mentorship session, whichever occurs first. By proceeding with payment and enrollment, you acknowledge and accept this non-refund policy.
            </p>
            <p className="mt-4">
              If you withdraw or are terminated from the Program prior to commencement (but after payment), BrandPushers may, at its sole discretion, issue a partial refund. No refunds will be issued after program commencement under any circumstances.
            </p>
          </section>

          {/* 4. Equity Stake */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Equity Stake and Ownership</h2>

            <h3 className="text-lg font-semibold text-white mb-2">4.1 Equity Arrangement</h3>
            <p>
              As a core component of the BrandPushers partnership model, BrandPushers (WHUT.AI LLC) will receive an equity stake in the Participant's company or brand entity. The specific equity percentage is determined on a case-by-case basis through mutual negotiation and will be clearly stated in your individual program agreement and/or term sheet prior to enrollment.
            </p>
            <p className="mt-4">
              By enrolling in the Program, you agree to the equity percentage specified in your individual program agreement, and to take all steps necessary to formalize and record this equity stake in your company's governing documents.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.2 Incorporation Requirement</h3>
            <p>
              <strong className="text-white">Participants are required to form a legal business entity</strong> (LLC, corporation, or equivalent) in connection with their brand prior to or promptly after program commencement. You agree to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Incorporate your company as a legal entity in a jurisdiction of your choosing</li>
              <li>Reflect BrandPushers' (WHUT.AI LLC's) agreed equity stake in your operating agreement, articles of organization, cap table, or shareholder agreement</li>
              <li>Provide BrandPushers with a copy of the relevant sections of your operating agreement evidencing the equity arrangement within 30 days of program commencement or company formation, whichever is later</li>
              <li>Ensure that any future amendments to your governing documents that affect BrandPushers' equity stake require BrandPushers' prior written consent</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">4.3 Nature of Equity</h3>
            <p>
              BrandPushers' equity stake represents a passive membership interest or shareholding in your entity. BrandPushers does not assume operational control or day-to-day management responsibilities unless separately agreed in writing. The equity stake entitles BrandPushers to its proportional share of distributions, proceeds from a sale or exit event, and any rights specified in the governing documents.
            </p>
          </section>

          {/* 5. IP */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>

            <h3 className="text-lg font-semibold text-white mb-2">5.1 Participant's Brand IP</h3>
            <p>
              You retain all intellectual property rights in your brand name, logo, product concepts, creative content, and proprietary business assets developed by you. BrandPushers does not claim ownership of your brand's intellectual property. BrandPushers' interest is limited to the equity stake described in Section 4.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">5.2 BrandPushers IP</h3>
            <p>
              The BrandPushers Platform, brand, curriculum, frameworks, tools, templates, and all related materials are and remain the exclusive property of WHUT.AI LLC. Nothing in these Terms grants you any ownership rights in BrandPushers' intellectual property. You may use program materials solely for the purpose of your participation in the Program.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">5.3 License Grant</h3>
            <p>
              BrandPushers grants you a limited, non-exclusive, non-transferable license to access and use program materials during your active program participation. This license terminates upon conclusion or termination of your program engagement.
            </p>
          </section>

          {/* 6. Participant Obligations */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Participant Obligations</h2>
            <p>As a Program Participant, you agree to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
              <li>Actively participate in scheduled mentorship sessions and program activities</li>
              <li>Provide accurate and truthful information about your brand and business</li>
              <li>Complete program phases in accordance with the agreed timeline</li>
              <li>Pay all program fees when due</li>
              <li>Form and maintain a valid legal entity and document the equity arrangement as required</li>
              <li>Comply with all applicable laws and regulations in operating your business</li>
              <li>Keep confidential any proprietary information shared by BrandPushers or other Participants</li>
              <li>Use the Platform and program resources only for lawful purposes</li>
            </ul>
          </section>

          {/* 7. Confidentiality */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Confidentiality</h2>
            <p>
              Each party may have access to confidential information of the other. You agree to keep BrandPushers' proprietary methodologies, business practices, and member information strictly confidential. BrandPushers agrees to treat your business information as confidential and will not disclose it to third parties except as permitted under our Privacy Policy or as required by law.
            </p>
          </section>

          {/* 8. Termination */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>

            <h3 className="text-lg font-semibold text-white mb-2">8.1 Termination by BrandPushers</h3>
            <p>
              BrandPushers reserves the right to terminate your participation in the Program immediately and without refund if you: (a) materially breach these Terms or your individual program agreement; (b) engage in fraudulent, deceptive, or illegal conduct; (c) fail to pay program fees when due; (d) fail to form a legal entity or document the equity arrangement as required; or (e) act in a manner detrimental to BrandPushers, other Participants, or the Program.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">8.2 Termination by Participant</h3>
            <p>
              You may withdraw from the Program at any time by providing written notice to BrandPushers. Withdrawal does not entitle you to any refund of program fees, and BrandPushers retains its equity stake in your company as agreed, regardless of your withdrawal.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">8.3 Survival</h3>
            <p>
              The following provisions survive termination: equity arrangements (Section 4), intellectual property rights (Section 5), confidentiality (Section 7), limitation of liability (Section 9), and dispute resolution (Section 10).
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer and Limitation of Liability</h2>

            <h3 className="text-lg font-semibold text-white mb-2">9.1 Disclaimer of Warranties</h3>
            <p>
              THE BRANDPUSHERS PLATFORM AND PROGRAM ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. BRANDPUSHERS DOES NOT WARRANT THAT THE PROGRAM WILL RESULT IN BUSINESS SUCCESS, SPECIFIC REVENUE, OR ANY PARTICULAR OUTCOME FOR YOUR BRAND.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">9.2 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BRANDPUSHERS AND ITS MEMBERS, MANAGERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE PROGRAM OR PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-4">
              IN NO EVENT SHALL BRANDPUSHERS' TOTAL LIABILITY TO YOU EXCEED THE TOTAL PROGRAM FEES PAID BY YOU IN THE THREE (3) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* 10. Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Dispute Resolution and Governing Law</h2>

            <h3 className="text-lg font-semibold text-white mb-2">10.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the <strong className="text-white">State of Wyoming, United States</strong>, without regard to its conflict of law principles.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">10.2 Informal Resolution</h3>
            <p>
              Before initiating any formal dispute process, you agree to contact us at{' '}
              <a href="mailto:hello@brandpushers.ai" className="text-brand-orange hover:underline">hello@brandpushers.ai</a>{' '}
              and attempt to resolve the dispute informally. Both parties agree to negotiate in good faith for at least 30 days before proceeding to arbitration.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">10.3 Binding Arbitration</h3>
            <p>
              Any dispute, claim, or controversy arising out of or relating to these Terms or the Program that cannot be resolved informally shall be submitted to binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitration shall be conducted in Wyoming or virtually if mutually agreed. The arbitrator's decision shall be final and binding.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6 mb-2">10.4 Class Action Waiver</h3>
            <p>
              You waive any right to bring claims as a plaintiff or class member in any purported class action, collective action, or representative proceeding.
            </p>
          </section>

          {/* 11. General */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. General Provisions</h2>
            <ul className="space-y-3">
              <li><strong className="text-white">Entire Agreement:</strong> These Terms, along with your individual program agreement and Privacy Policy, constitute the entire agreement between you and BrandPushers regarding the Program.</li>
              <li><strong className="text-white">Severability:</strong> If any provision of these Terms is found invalid or unenforceable, the remaining provisions will continue in full force and effect.</li>
              <li><strong className="text-white">Waiver:</strong> Failure to enforce any provision of these Terms shall not constitute a waiver of our right to enforce it in the future.</li>
              <li><strong className="text-white">Assignment:</strong> You may not assign your rights or obligations under these Terms without BrandPushers' prior written consent. BrandPushers may assign these Terms in connection with a merger, acquisition, or sale of assets.</li>
              <li><strong className="text-white">Modifications:</strong> BrandPushers reserves the right to modify these Terms at any time. Material changes will be communicated via email or prominent notice on the Platform. Continued use of the Platform after changes constitutes acceptance.</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
            <p>For questions about these Terms, please contact:</p>
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

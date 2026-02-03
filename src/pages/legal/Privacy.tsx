import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | BountyBay</title>
        <meta name="description" content="Learn how BountyBay collects, uses, and protects your personal information. Read our privacy policy for details on data handling and your rights." />
        <link rel="canonical" href="https://bountybay.co/legal/privacy" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Effective Date: January 10, 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bountybay Ltd. ("BountyBay," "we," "us," or "our") is committed to protecting your privacy 
                and ensuring the security of your personal information. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our reverse marketplace 
                platform at bountybay.co (the "Platform"). By using the Platform, you consent to the data 
                practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">2.1 Information You Provide</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Account registration information (email address, username, password)</li>
                    <li>Profile information (display name, bio, avatar, location/region)</li>
                    <li>Identity verification documents (processed securely through Stripe)</li>
                    <li>Payment and banking information (processed and stored by Stripe)</li>
                    <li>Content you create (bounty posts, claims, messages, reviews)</li>
                    <li>Communications with our support team</li>
                    <li>Shipping addresses for physical item deliveries</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.2 Automatically Collected Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Device information (browser type, operating system, device identifiers)</li>
                    <li>Log data (IP address, access times, pages viewed, referring URLs)</li>
                    <li>Usage patterns and interactions with the Platform</li>
                    <li>Cookies and similar tracking technologies (see Section 7)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.3 Information from Third Parties</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Identity verification results from Stripe</li>
                    <li>Payment processing data from Stripe</li>
                    <li>Authentication data if you sign in via Google or other OAuth providers</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our marketplace services</li>
                <li><strong>Transaction Processing:</strong> To process payments, escrow, and payouts securely</li>
                <li><strong>Identity Verification:</strong> To verify user identities and prevent fraud</li>
                <li><strong>Communication:</strong> To facilitate messaging between users and send service notifications</li>
                <li><strong>Customer Support:</strong> To respond to inquiries and resolve disputes</li>
                <li><strong>Safety & Security:</strong> To detect and prevent fraudulent, abusive, or illegal activities</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve the Platform</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">4.1 With Other Users</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your public profile information (username, avatar, verification status, ratings) is visible 
                    to other users. Bounty posts and claims are publicly visible. Private messages are only 
                    accessible to conversation participants. Shipping addresses are shared only with the Hunter 
                    fulfilling your bounty.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4.2 With Service Providers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We share information with trusted third-party providers who assist in operating our Platform:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Stripe:</strong> Payment processing, escrow services, and identity verification</li>
                    <li><strong>Supabase:</strong> Database hosting, authentication, and file storage</li>
                    <li><strong>Infrastructure Providers:</strong> Cloud hosting and content delivery</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    These providers are contractually bound to protect your information and may only use it for 
                    the services they provide to us.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4.3 Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may disclose your information when required by law, subpoena, or legal process; to protect 
                    our rights, property, or safety; to investigate fraud or security issues; or in connection 
                    with a merger, acquisition, or sale of assets.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">4.4 No Sale of Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Storage and Security</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">5.1 Data Storage</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your data is stored on secure servers provided by Supabase with data centers in North America. 
                    Payment data is stored and processed by Stripe in accordance with PCI-DSS standards. We do not 
                    store complete credit card numbers or sensitive payment details on our servers.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.2 Security Measures</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>TLS/SSL encryption for all data in transit</li>
                    <li>Encryption at rest for stored data</li>
                    <li>Row-level security policies for database access control</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Secure authentication with password hashing</li>
                    <li>Access controls limiting employee access to personal data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">5.3 Security Limitations</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    While we implement industry-standard security measures, no method of electronic transmission 
                    or storage is 100% secure. We cannot guarantee absolute security of your information.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We retain your information for as long as necessary to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal and regulatory obligations (e.g., tax records for 7 years)</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Prevent fraud and abuse</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                After account deletion, we may retain certain information in anonymized or aggregated form for 
                analytics purposes, or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use cookies and similar technologies for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Platform</li>
                <li><strong>Security Cookies:</strong> Detect and prevent fraudulent activity</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You can manage cookie preferences through your browser settings. Disabling essential cookies 
                may affect Platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your Rights and Choices</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">8.1 Account Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Access and update your profile information at any time</li>
                    <li>Control notification and communication preferences</li>
                    <li>Download your data upon request</li>
                    <li>Delete your account through account settings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">8.2 Canadian Privacy Rights (PIPEDA)</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Access your personal information held by us</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Withdraw consent for certain data processing activities</li>
                    <li>File a complaint with the Privacy Commissioner of Canada</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">8.3 Additional Rights (GDPR/CCPA)</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    If you are located in the European Union or California, you may have additional rights including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Right to erasure ("right to be forgotten")</li>
                    <li>Right to data portability</li>
                    <li>Right to restrict processing</li>
                    <li>Right to object to automated decision-making</li>
                    <li>Right to know what personal information is collected and disclosed</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of 
                residence, including Canada and the United States where our service providers operate. These 
                countries may have different data protection laws. We ensure appropriate safeguards are in 
                place, including standard contractual clauses and compliance with applicable data protection 
                frameworks.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                BountyBay is not intended for users under 18 years of age. We do not knowingly collect personal 
                information from children under 18. If we become aware that we have inadvertently collected 
                such information, we will take immediate steps to delete it. If you believe a child has 
                provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform may contain links to third-party websites or services. We are not responsible 
                for the privacy practices of these third parties. We encourage you to review the privacy 
                policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or 
                applicable law. We will notify you of material changes by email or prominent notice on the 
                Platform at least 30 days before they take effect. The "Effective Date" at the top indicates 
                when this policy was last revised. Your continued use constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If you have questions about this Privacy Policy, wish to exercise your privacy rights, or 
                have concerns about our data practices, please visit our Support Center:
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link to="/support">Visit Support Center</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Select "Account / Privacy Request" when creating your ticket for GDPR/PIPEDA data requests, 
                  or use our AI Assistant for quick answers to common questions.
                </p>
              </div>
              <div className="text-muted-foreground space-y-1 mt-4">
                <p><strong>Bountybay Ltd.</strong></p>
                <p>Website: bountybay.co</p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We will respond to privacy-related inquiries within 30 days.
              </p>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-xs text-muted-foreground text-center">
                © 2025 Bountybay Ltd. All rights reserved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

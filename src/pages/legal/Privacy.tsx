import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
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
          <p className="text-muted-foreground">Last updated: January 1, 2024</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                BountyBay ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our reverse marketplace platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Account credentials and profile information</li>
                    <li>Identity verification documents (through Stripe Identity)</li>
                    <li>Payment information (processed securely by Stripe)</li>
                    <li>Geographic location information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Bounty posts, claims, and messages</li>
                    <li>Search queries and browsing activity</li>
                    <li>Transaction history and payment records</li>
                    <li>Device information and IP addresses</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Provide and maintain our marketplace services</li>
                <li>Process transactions and payments securely</li>
                <li>Verify user identities and prevent fraud</li>
                <li>Facilitate communication between users</li>
                <li>Improve our platform and user experience</li>
                <li>Send important updates and notifications</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">With Other Users</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your profile information, bounty posts, and public messages are visible to other 
                    users. Private messages are only shared between participants in the conversation.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">With Service Providers</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We share information with trusted third-party service providers who help us operate our platform:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Stripe for payment processing and identity verification</li>
                    <li>Supabase for data storage and authentication</li>
                    <li>Cloud hosting and infrastructure providers</li>
                    <li>Analytics and monitoring services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may disclose your information when required by law, to protect our rights, 
                    or to ensure the safety and security of our users and platform.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Storage and Security</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Data Storage</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your data is stored securely using Supabase, which provides enterprise-grade 
                    security and compliance. Data is encrypted both in transit and at rest.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Security Measures</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>End-to-end encryption for sensitive data</li>
                    <li>Regular security audits and updates</li>
                    <li>Multi-factor authentication options</li>
                    <li>Secure payment processing through Stripe</li>
                    <li>Access controls and monitoring</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Maintain your login session</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Detect and prevent fraudulent activity</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights and Choices</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Account Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Update your profile information at any time</li>
                    <li>Control your communication preferences</li>
                    <li>Deactivate or delete your account</li>
                    <li>Export your data upon request</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Privacy Rights (GDPR/CCPA)</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    Depending on your location, you may have additional rights including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Right to access your personal data</li>
                    <li>Right to correct inaccurate information</li>
                    <li>Right to delete your data</li>
                    <li>Right to data portability</li>
                    <li>Right to opt-out of data sales (we don't sell personal data)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements. 
                Transaction records may be retained for longer periods as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your 
                own. We ensure appropriate safeguards are in place to protect your data during 
                international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                BountyBay is not intended for users under 18 years of age. We do not knowingly 
                collect personal information from children under 18. If we become aware that we 
                have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by posting the new policy on our platform and updating the 
                "last updated" date. Your continued use constitutes acceptance of the changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="text-muted-foreground">
                <p>Email: privacy@bountybay.co</p>
                <p>Data Protection Officer: dpo@bountybay.co</p>
                <p>Address: [Company Address]</p>
              </div>
            </section>

            <div className="bg-muted/50 rounded-lg p-4 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a placeholder Privacy Policy for demonstration purposes. 
                In a real application, you should consult with legal professionals to create a comprehensive 
                privacy policy that complies with applicable privacy laws and regulations such as GDPR, CCPA, 
                and other relevant legislation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
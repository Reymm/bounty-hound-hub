import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Terms() {
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
          <CardTitle className="text-2xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: January 1, 2024</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to BountyBay, a reverse marketplace platform that connects people looking for 
                hard-to-find items with hunters who can locate them. These Terms of Service ("Terms") 
                govern your use of our platform and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Platform Overview</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                BountyBay operates as a marketplace where:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Users can post bounties for items they're seeking</li>
                <li>Hunters can claim bounties and provide leads or found items</li>
                <li>Payments are processed securely through our escrow system</li>
                <li>All transactions are subject to verification requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Account Registration</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To use BountyBay, you must create an account and provide accurate information. 
                    You are responsible for maintaining the security of your account credentials.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Identity Verification</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Certain features require identity verification through Stripe Identity. 
                    This includes messaging other users and submitting bounty claims.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Bounties</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Posting Bounties</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Bounty posters must provide accurate item descriptions</li>
                    <li>All posted content must comply with our community guidelines</li>
                    <li>Bounty amounts must be deposited into escrow before activation</li>
                    <li>Verification requirements must be clearly specified</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Claiming Bounties</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Hunters must meet all verification requirements</li>
                    <li>Claims must include valid proof as specified by the poster</li>
                    <li>False or misleading claims may result in account suspension</li>
                    <li>Payment release is subject to poster approval</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Payments and Fees</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Escrow System</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All bounty payments are processed through our secure escrow system powered by Stripe. 
                    Funds are held until the bounty poster approves the delivery.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Platform Fees</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Platform fee: 3.5% of the bounty amount</li>
                    <li>Payment processing fees apply as per Stripe's rates</li>
                    <li>Fees are deducted from payments to hunters</li>
                    <li>Refunds are processed minus applicable fees</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Posting bounties for illegal items or services</li>
                <li>Submitting false or fraudulent claims</li>
                <li>Circumventing the platform's payment system</li>
                <li>Harassment or inappropriate communication</li>
                <li>Creating multiple accounts to manipulate ratings</li>
                <li>Violating intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                In case of disputes between bounty posters and hunters, BountyBay provides mediation 
                services. Our team will review evidence from both parties and make a determination 
                regarding payment release or refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Privacy and Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand 
                how we collect, use, and protect your personal information. By using BountyBay, 
                you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                BountyBay acts as a platform connecting buyers and hunters. We are not responsible 
                for the quality, legality, or accuracy of items found through our platform. 
                Users engage with each other at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. Users will be notified 
                of significant changes, and continued use of the platform constitutes acceptance 
                of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 text-muted-foreground">
                <p>Email: legal@bountybay.com</p>
                <p>Address: [Company Address]</p>
              </div>
            </section>

            <div className="bg-muted/50 rounded-lg p-4 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a placeholder Terms of Service for demonstration purposes. 
                In a real application, you should consult with legal professionals to create comprehensive 
                terms that comply with applicable laws and regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
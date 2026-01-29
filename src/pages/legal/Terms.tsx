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
          <p className="text-muted-foreground">Effective Date: January 10, 2025</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") 
                and Bountybay Ltd., a corporation incorporated under the laws of Canada ("BountyBay," "we," "us," or "our"). 
                By accessing or using our platform at bountybay.co (the "Platform"), you acknowledge that you have read, 
                understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access 
                or use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Platform Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                BountyBay operates as a reverse marketplace platform that facilitates connections between individuals 
                seeking specific items ("Posters") and individuals capable of locating such items ("Hunters"). 
                The Platform provides:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>A venue for Posters to publish requests ("Bounties") for specific items</li>
                <li>A mechanism for Hunters to submit claims and provide proof of item location</li>
                <li>Secure escrow payment processing through Stripe</li>
                <li>Identity verification services to ensure user authenticity</li>
                <li>Communication tools between verified users</li>
                <li>Dispute resolution and customer support services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Eligibility and Account Registration</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">3.1 Eligibility Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To use BountyBay, you must: (a) be at least 18 years of age; (b) have the legal capacity to enter 
                    into a binding contract; (c) not be prohibited from using the Platform under applicable law; and 
                    (d) not have been previously suspended or removed from the Platform.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">3.2 Account Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all 
                    activities that occur under your account. You agree to immediately notify us of any unauthorized 
                    use of your account or any other breach of security.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">3.3 Identity Verification</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Certain Platform features require identity verification through our payment partner, Stripe. 
                    By completing verification, you authorize Stripe to collect and process your identity documents 
                    in accordance with their privacy policy. Verified users display a verification badge on their profile.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Bounty Terms and Conditions</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">4.1 Posting Bounties</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Posters must provide accurate and complete item descriptions</li>
                    <li>All posted content must comply with our Acceptable Use Policy (Section 7)</li>
                    <li>Bounty amounts must be deposited into escrow prior to publication</li>
                    <li>Verification requirements must be clearly specified at time of posting</li>
                    <li>Posters are responsible for reviewing submissions in good faith</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">4.2 Claiming Bounties</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Hunters must meet all verification requirements specified by the Poster</li>
                    <li>Claims must include valid proof as specified in the Bounty listing</li>
                    <li>False, misleading, or fraudulent claims constitute grounds for immediate suspension</li>
                    <li>Payment release is contingent upon Poster approval of submitted proof</li>
                    <li>Hunters must complete identity verification through Stripe Connect to receive payouts</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">4.3 Shipping Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    For Bounties requiring physical delivery, Hunters must provide valid tracking information. 
                    Funds will be released upon confirmed delivery or after tracking shows delivery status. 
                    BountyBay is not responsible for items lost, stolen, or damaged during shipping. 
                    <strong>Hunters are strongly encouraged to purchase shipping insurance for items valued over $100.</strong> 
                    Neither BountyBay nor the Poster shall be liable for shipping-related losses; all claims must 
                    be filed directly with the shipping carrier or insurance provider.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Fees and Payment Terms</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">5.1 Escrow System</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All Bounty payments are processed through our secure escrow system powered by Stripe. 
                    Funds are held in escrow until the Poster approves delivery or a dispute is resolved. 
                    This protects both parties and ensures fair transactions.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">5.2 Finality of Acceptance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>IMPORTANT:</strong> Acceptance of a submission by the Poster constitutes final 
                    approval of the Hunter's work. Once the Poster clicks "Accept" and funds are released 
                    to the Hunter, the transaction is complete and irreversible. No refunds will be issued 
                    after payout has been processed. Posters are responsible for thoroughly reviewing all 
                    proof and evidence before accepting a submission. BountyBay strongly recommends using 
                    the 7-day hold period to verify delivery before early release of funds.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">5.3 Fee Schedule</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Posters:</strong> No platform fee. Only the bounty reward amount plus Stripe processing fees (approximately 2.9% + $0.30 per transaction)</li>
                    <li><strong>Hunters:</strong> Platform fee of $2 + 5% of bounty amount, plus Stripe transfer fees (approximately 0.25% + $0.25), deducted from payout</li>
                    <li><strong>Example:</strong> On a $100 bounty, Hunters receive approximately $92 after fees</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    <strong>Fee Modifications:</strong> BountyBay reserves the right to modify its fee structure at any time. 
                    We will provide at least 30 days' notice of any fee changes via email or Platform notification. 
                    Continued use of the Platform after fee changes take effect constitutes acceptance of the new fees.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">5.4 Cancellation Policy</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Bounties can be cancelled at any time before a submission is approved</li>
                    <li>No cancellation fees apply - your card is only charged when you approve a submission</li>
                    <li>Bounties with accepted claims may not be cancelled without mutual agreement</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">5.5 Payout Timing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Following approval of a claim, payouts are processed through Stripe Connect and typically 
                    arrive within 2-7 business days depending on your location and banking institution. 
                    BountyBay is not responsible for delays caused by banks or payment networks.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Platform Role and Liability</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">6.1 Marketplace Facilitator</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    BountyBay operates solely as a marketplace facilitator connecting Posters and Hunters. 
                    We are not a party to any transaction between users and do not act as an agent for either party. 
                    We do not take ownership of, inspect, or verify any items listed or transacted on the Platform.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">6.2 No Warranty on Items</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    BountyBay makes no representations or warranties regarding the quality, authenticity, legality, 
                    safety, or suitability of any items found through the Platform. All transactions are conducted 
                    at the users' own risk. Users are solely responsible for verifying item authenticity and condition.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">6.3 User Disputes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    While we provide dispute resolution services, BountyBay is not liable for any disputes between 
                    users. Our dispute resolution decisions are made in good faith based on available evidence but 
                    are not legally binding arbitration.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Acceptable Use Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree not to use the Platform for any unlawful purpose or in violation of these Terms. 
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Posting Bounties for illegal items, stolen goods, or controlled substances</li>
                <li>Submitting false, fraudulent, or misleading claims</li>
                <li>Circumventing the Platform's payment system or conducting off-platform transactions</li>
                <li>Soliciting users to complete transactions outside of BountyBay</li>
                <li>Harassment, threats, or inappropriate communication with other users</li>
                <li>Creating multiple accounts to manipulate ratings or circumvent suspensions</li>
                <li>Infringing upon intellectual property rights of third parties</li>
                <li>Uploading malicious content, viruses, or harmful code</li>
                <li>Attempting to access accounts or systems without authorization</li>
                <li>Engaging in any activity that disrupts or interferes with the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Dispute Resolution</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">8.1 Internal Resolution</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    In the event of a dispute between a Poster and Hunter, either party may open a dispute through 
                    the Platform. Our support team will review evidence submitted by both parties and render a 
                    decision regarding payment release or refund within 14 business days.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">8.2 Governing Law</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of the Province of 
                    Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">8.3 Jurisdiction</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree to submit to the exclusive jurisdiction of the courts located in the Province of Ontario, 
                    Canada, for any disputes arising out of or relating to these Terms or your use of the Platform.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">9.1 Platform Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Platform and its original content, features, and functionality are owned by Bountybay Ltd. 
                    and are protected by international copyright, trademark, patent, trade secret, and other 
                    intellectual property laws.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">9.2 User Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By posting content on the Platform, you grant BountyBay a non-exclusive, royalty-free, 
                    worldwide license to use, display, and distribute such content in connection with operating 
                    and promoting the Platform. You retain ownership of your content.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOUNTYBAY LTD. AND ITS OFFICERS, DIRECTORS, EMPLOYEES, 
                AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                DAMAGES ARISING FROM OR RELATED TO YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Items that are counterfeit, damaged, or not as described</li>
                <li>Disputes between users that cannot be resolved</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Any third-party conduct or content on the Platform</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                In no event shall our total liability exceed the greater of $100 USD or the fees paid by you to 
                BountyBay in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Bountybay Ltd. and its officers, directors, 
                employees, agents, and affiliates from and against any and all claims, damages, obligations, 
                losses, liabilities, costs, and expenses arising from: (a) your use of the Platform; (b) your 
                violation of these Terms; (c) your violation of any third-party rights; or (d) any content you 
                submit to the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Termination</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">12.1 By User</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may terminate your account at any time through your account settings. Upon termination, 
                    pending transactions must be completed or cancelled, and any outstanding balances will be 
                    processed according to our standard procedures.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">12.2 By BountyBay</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time for violations of these 
                    Terms, fraudulent activity, or any other reason at our sole discretion. We will make reasonable 
                    efforts to provide notice, except in cases of severe violations.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. Material changes will be communicated 
                via email or prominent notice on the Platform at least 30 days before taking effect. Your 
                continued use of the Platform after such modifications constitutes acceptance of the updated Terms. 
                If you do not agree to the modified Terms, you must discontinue use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">14. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining 
                provisions shall continue in full force and effect. The invalid provision shall be modified to 
                the minimum extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">15. Force Majeure</h2>
              <p className="text-muted-foreground leading-relaxed">
                BountyBay shall not be liable for any failure or delay in performing its obligations under these 
                Terms due to circumstances beyond its reasonable control, including but not limited to: natural 
                disasters, acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, 
                fire, floods, pandemics, epidemics, strikes, power outages, internet or telecommunications failures, 
                or failures of third-party service providers (including Stripe and Supabase). During such events, 
                BountyBay's obligations shall be suspended until the force majeure event ceases.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">16. No Waiver</h2>
              <p className="text-muted-foreground leading-relaxed">
                The failure of BountyBay to enforce any right or provision of these Terms shall not constitute a 
                waiver of such right or provision. Any waiver of any provision of these Terms will be effective 
                only if in writing and signed by BountyBay. No single or partial exercise of any right or remedy 
                shall preclude any other or further exercise thereof.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">17. Assignment</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not assign or transfer these Terms or your rights hereunder without BountyBay's prior 
                written consent. BountyBay may freely assign or transfer these Terms and its rights and obligations 
                hereunder, in whole or in part, without restriction or notification, including in connection with 
                a merger, acquisition, sale of assets, or by operation of law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">18. Survival</h2>
              <p className="text-muted-foreground leading-relaxed">
                The following sections shall survive any termination or expiration of these Terms: Platform Role 
                and Liability (Section 6), Limitation of Liability (Section 10), Indemnification (Section 11), 
                Dispute Resolution (Section 8), Intellectual Property (Section 9), and any other provisions that 
                by their nature should survive termination.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">19. Electronic Communications</h2>
              <p className="text-muted-foreground leading-relaxed">
                By using the Platform, you consent to receive electronic communications from BountyBay, including 
                emails, push notifications, and in-Platform messages. You agree that all agreements, notices, 
                disclosures, and other communications provided electronically satisfy any legal requirement that 
                such communications be in writing. You are responsible for maintaining a valid email address and 
                checking for communications regularly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">20. Entire Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
                Bountybay Ltd. regarding your use of the Platform and supersede all prior agreements, 
                representations, and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">21. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                For questions regarding these Terms of Service, please visit our Support Center:
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link to="/support">Contact Support</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Create a support ticket and our team will respond within 24-48 hours.
                </p>
              </div>
              <div className="mt-4 text-muted-foreground space-y-1">
                <p><strong>Bountybay Ltd.</strong></p>
                <p>Website: bountybay.co</p>
              </div>
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
  );
}

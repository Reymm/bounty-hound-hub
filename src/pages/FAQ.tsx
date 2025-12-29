import { Helmet } from 'react-helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is BountyBay?",
        a: "BountyBay is a marketplace that connects people looking for hard-to-find items with hunters who can locate them. Posters create bounties with rewards for finding specific items, and hunters earn money by successfully tracking them down."
      },
      {
        q: "How do I create an account?",
        a: "Click the 'Sign Up' button in the top navigation. You can register with your email address. After signing up, you'll be prompted to complete your profile with a username and optional details."
      },
      {
        q: "Is BountyBay free to use?",
        a: "Creating an account and browsing bounties is completely free. Posters pay the bounty reward plus Stripe processing fees when posting. Hunters pay nothing upfront—a $2 + 5% platform fee is deducted from successful payouts."
      }
    ]
  },
  {
    category: "Posting Bounties",
    questions: [
      {
        q: "How do I post a bounty?",
        a: "Click 'Post a Bounty' in the navigation. Fill in the item details, set your reward amount (finder's fee), add reference images if helpful, and set a deadline. Your reward is held in escrow via Stripe until a hunter successfully completes the bounty."
      },
      {
        q: "What's the difference between the bounty reward and target price?",
        a: "The bounty reward (finder's fee) is what you pay the hunter for finding the item. The target price range is your budget for the actual item purchase—this helps hunters know what you're willing to spend on the item itself."
      },
      {
        q: "Can the hunter purchase the item for me?",
        a: "Yes! When posting, you can enable the 'Hunter purchases item' option. After the hunter finds the item and you approve it, you'll provide additional funds through Stripe for them to make the purchase on your behalf."
      },
      {
        q: "What if no one claims my bounty?",
        a: "If your bounty expires without an accepted submission, you can request a refund of your escrowed funds minus any applicable processing fees."
      },
      {
        q: "Can I cancel my bounty?",
        a: "Yes, but cancellation fees may apply depending on timing. Cancelling early has lower fees, while cancelling after hunters have invested time may incur higher fees to compensate for their effort."
      }
    ]
  },
  {
    category: "Claiming Bounties (For Hunters)",
    questions: [
      {
        q: "How do I claim a bounty?",
        a: "Browse open bounties and find one you can help with. Click 'Claim Bounty' and submit proof that you've found the item (photos, links, screenshots). The poster will review your submission."
      },
      {
        q: "Do I need to set up anything before claiming?",
        a: "Yes, you need to complete Stripe Connect setup before you can claim bounties. This ensures we can pay you when your claim is accepted. You'll be prompted to do this when attempting your first claim."
      },
      {
        q: "What counts as valid proof?",
        a: "Proof varies by bounty type. Typically: photos of the item, links to where it can be purchased, screenshots of availability, or contact information for sellers. The poster specifies what verification they need."
      },
      {
        q: "What if my claim is rejected?",
        a: "The poster may request revisions if your submission is close but needs more info. If rejected entirely, you'll receive the reason why. You can submit a new claim if the bounty is still open."
      },
      {
        q: "When do I get paid?",
        a: "Payment is sent via PayPal 7 days after the poster accepts your submission. This hold period protects against fraud and chargebacks. You must complete identity verification through Stripe Connect before receiving your first payout."
      },
      {
        q: "Why is there a 7-day waiting period?",
        a: "The 7-day hold protects the platform against credit card chargebacks and gives time to resolve any disputes. After the hold period, you'll receive payment via PayPal within 2-3 business days."
      }
    ]
  },
  {
    category: "Payments & Fees",
    questions: [
      {
        q: "What are the platform fees?",
        a: "Posters pay no platform fee—only the bounty reward plus Stripe processing fees (~2.9% + 30¢). Hunters pay a $2 + 5% platform fee, deducted from their payout when a bounty is successfully completed."
      },
      {
        q: "How do payouts work?",
        a: "When a poster accepts your claim, funds are captured from escrow and held for 7 days. After the hold period, you'll receive payment via PayPal to the email address in your profile. All hunters must complete identity verification through Stripe Connect before receiving their first payout."
      },
      {
        q: "Are there PayPal fees on payouts?",
        a: "We cover PayPal transfer fees on our end, so you receive the full payout amount after the platform fee ($2 + 5%). No additional fees are deducted from your payment."
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are processed through Stripe, a PCI-compliant payment processor. Funds are held in escrow until the bounty is completed, protecting both posters and hunters."
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit and debit cards through Stripe. Posters pay when creating a bounty, and hunters receive payouts via PayPal."
      },
      {
        q: "What are the cancellation fees?",
        a: "If you cancel a bounty within 24 hours of posting, there's no platform cancellation fee. After 24 hours, a 2% cancellation fee applies to cover administrative costs. Additionally, Stripe does not refund their processing fees (~2.9% + 30¢) on refunds, so you'll lose that portion regardless of timing. For example, cancelling a $100 bounty after 24 hours means you'd lose approximately $5.20 total ($2 platform fee + $3.20 Stripe fee) and receive ~$94.80 back."
      }
    ]
  },
  {
    category: "Shipping & Delivery",
    questions: [
      {
        q: "How does shipping work?",
        a: "If the bounty requires physical item delivery, the poster provides shipping details after accepting the claim. The hunter ships the item and can add tracking information. Payment may be held until delivery is confirmed."
      },
      {
        q: "What if the item is damaged in shipping?",
        a: "We recommend hunters use tracked and insured shipping. If there's a dispute about condition, you can open a support ticket and our team will help mediate."
      },
      {
        q: "Do all bounties require shipping?",
        a: "No. Many bounties are for information or leads—like finding where to buy an item or locating a seller. The poster specifies whether physical delivery is required when creating the bounty."
      }
    ]
  },
  {
    category: "Disputes & Support",
    questions: [
      {
        q: "What if I have a problem with a transaction?",
        a: "Open a support ticket from your bounty page or through the Support link. Describe the issue and our team will investigate. We have a dispute resolution process to handle disagreements fairly."
      },
      {
        q: "How do I report a user?",
        a: "You can report users for fraud, harassment, spam, or other issues from their profile or from a bounty/submission page. Our admin team reviews all reports and takes appropriate action."
      },
      {
        q: "Can I get a refund?",
        a: "Refunds depend on the situation. If a bounty expires unfilled, you can request a refund. If there's a dispute with an accepted claim, our team will review and determine appropriate resolution."
      }
    ]
  },
  {
    category: "Account & Profile",
    questions: [
      {
        q: "How do ratings work?",
        a: "After a successful bounty completion, both the poster and hunter can rate each other. Ratings build your reputation score, helping others trust you in future transactions."
      },
      {
        q: "What is KYC verification?",
        a: "Know Your Customer (KYC) verification is identity verification required for hunters before they can claim bounties. This helps prevent fraud and builds trust in our marketplace."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Contact support to request account deletion. Note that active bounties must be resolved first, and some transaction records may be retained for legal compliance."
      }
    ]
  }
];

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>FAQ - BountyBay</title>
        <meta name="description" content="Frequently asked questions about BountyBay - learn how to post bounties, claim rewards, handle payments, and more." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using BountyBay. Can't find what you're looking for? 
              <a href="mailto:contact@bountybay.co" className="text-primary hover:underline ml-1">
                Contact us
              </a>.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqData.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {section.category}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, itemIndex) => (
                    <AccordionItem 
                      key={itemIndex} 
                      value={`${sectionIndex}-${itemIndex}`}
                      className="border-border"
                    >
                      <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-12 text-center p-8 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help with any issues or questions.
            </p>
            <a 
              href="/support" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

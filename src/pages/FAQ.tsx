import { Helmet } from 'react-helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, DollarSign, Shield, Truck, Users, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const faqData = [
  {
    category: "Getting Started",
    icon: Users,
    questions: [
      {
        q: "What is BountyBay?",
        a: "BountyBay is a reverse marketplace where you post what you're looking for, and verified hunters find it for you. Think of it as a \"finder's fee\" marketplace—you set a reward, hunters compete to find your item, and you only pay when someone delivers."
      },
      {
        q: "How is this different from eBay or regular marketplaces?",
        a: "Traditional marketplaces show you what's already listed for sale. BountyBay flips it—you post what you WANT, and hunters actively search for it. Perfect for rare items, discontinued products, vintage collectibles, or anything hard to find through normal shopping."
      },
      {
        q: "Who uses BountyBay?",
        a: "Collectors hunting for rare items, people looking for discontinued products, vintage enthusiasts, sneakerheads chasing limited releases, anyone who's ever thought \"I'd pay someone to find this for me.\" Hunters are often resellers, thrift experts, or people with great sourcing skills."
      },
      {
        q: "Is BountyBay free to use?",
        a: "Browsing and creating an account is free. Posters pay only when they fund a bounty (reward + Stripe fees). Hunters pay nothing upfront—a small platform fee is deducted only from successful payouts."
      },
      {
        q: "How do I create an account?",
        a: "Click 'Sign Up' in the top navigation and register with your email. You'll set up a username and profile. To claim bounties as a hunter, you'll need to verify your identity through Stripe—this only takes a few minutes."
      }
    ]
  },
  {
    category: "Posting Bounties",
    icon: DollarSign,
    questions: [
      {
        q: "How do I post a bounty?",
        a: "Click 'Post a Bounty' and describe what you're looking for. Add photos if you have them, set your finder's fee (reward), specify your budget for the item itself, set a deadline, and fund the escrow. Your reward is held securely until a hunter delivers."
      },
      {
        q: "What's the difference between the bounty reward and target price?",
        a: "The REWARD (finder's fee) is what you pay the hunter for finding the item—this goes into escrow. The TARGET PRICE is your budget for the actual item purchase. For example: '$50 reward to find me vintage Nike Dunks, willing to pay up to $300 for the shoes themselves.'"
      },
      {
        q: "Can the hunter buy the item for me?",
        a: "Yes! Enable 'Hunter purchases item' when posting. The hunter finds the item, you approve it, then you send additional funds through the platform for them to purchase and ship it to you. Great for items you can't buy directly."
      },
      {
        q: "What makes a good bounty post?",
        a: "Be specific: include brand, model, size, color, condition requirements, and any variations you'd accept. Add reference photos. Set a realistic reward—hunters are more motivated by fair compensation. Clear verification requirements help hunters know exactly what proof you need."
      },
      {
        q: "How long should I set my deadline?",
        a: "Depends on rarity. Common items: 1-2 weeks. Rare collectibles: 1-3 months. The rarer the item, the more time hunters need to search. You can always extend deadlines or cancel if needed."
      },
      {
        q: "What if no one claims my bounty?",
        a: "If your bounty expires without an accepted claim, you can request a full refund of your escrowed funds (minus Stripe processing fees, which are non-refundable). Consider increasing the reward or adjusting requirements to attract more hunters."
      },
      {
        q: "Can I cancel my bounty?",
        a: "Yes, you can cancel anytime before a claim is accepted. If a hunter has an accepted claim in progress, cancellation requires mutual agreement. You only pay if you approve a submission."
      }
    ]
  },
  {
    category: "Hunting & Claiming Bounties",
    icon: Shield,
    questions: [
      {
        q: "How do I become a hunter?",
        a: "Anyone can browse bounties, but to claim them you need to verify your identity and set up payouts. This takes about 5 minutes. Go to the Verification page from the navigation menu to get started."
      },
      {
        q: "How do I claim a bounty?",
        a: "Find a bounty you can help with, click 'Claim Bounty,' and submit proof that you've found the item. This might be photos, purchase links, seller contact info, or screenshots—whatever the poster specified as verification."
      },
      {
        q: "What counts as valid proof?",
        a: "Check what the poster specified. Common proof: photos of the actual item with timestamps, links to active listings, screenshots of availability/pricing, seller contact information. The clearer your proof, the faster approval happens."
      },
      {
        q: "Can multiple hunters claim the same bounty?",
        a: "Yes, bounties can receive multiple claims. The poster reviews all submissions and approves the best one. First-come doesn't always win—quality of the lead matters. Some posters accept multiple claims if hunters find different sources."
      },
      {
        q: "What if my claim is rejected?",
        a: "The poster must provide a reason. Common issues: item doesn't match specs, proof isn't clear enough, condition not as required. You can submit a revised claim if the bounty is still open. Unfair rejections can be disputed through support."
      },
      {
        q: "What if the poster requests revisions?",
        a: "Revisions mean you're close! The poster needs more info—maybe clearer photos, pricing confirmation, or additional details. Respond promptly to revision requests to secure the bounty."
      },
      {
        q: "How do I build a good hunter reputation?",
        a: "Complete bounties successfully, communicate clearly, provide quality proof, and earn 5-star ratings. High-rated hunters get more trust from posters. Your verification badge and rating display on your profile."
      }
    ]
  },
  {
    category: "Payments & Fees",
    icon: DollarSign,
    questions: [
      {
        q: "What are the fees?",
        a: "POSTERS: No platform fee. You pay the bounty reward + Stripe processing (~3.7% + $0.30). HUNTERS: $2 + 5% platform fee, deducted from your payout. Example: $100 bounty → hunter receives $93."
      },
      {
        q: "Why do hunters pay fees but not posters?",
        a: "We want posting to be frictionless—more bounties means more opportunities for hunters. Hunters only pay when they successfully earn money, so you never pay unless you're getting paid. It aligns incentives for everyone."
      },
      {
        q: "How does escrow work?",
        a: "When a poster funds a bounty, the reward is held securely by Stripe (not BountyBay). Funds are only released when the poster approves a claim. This protects hunters from non-payment and posters from paying for bad leads."
      },
      {
        q: "When do hunters get paid?",
        a: "After the poster approves your claim, funds are held for 7 days (fraud protection), then automatically transferred to your Stripe account. Bank deposits typically arrive 2-3 business days after that."
      },
      {
        q: "Why is there a 7-day hold?",
        a: "The hold protects against credit card chargebacks and gives time to resolve any disputes. It's standard for marketplace platforms. After 7 days, your payout is automatic—no action needed."
      },
      {
        q: "What payment methods are accepted?",
        a: "Posters can pay with any major credit/debit card. Hunters receive payouts via Stripe Connect to their linked bank account. We support most countries where Stripe operates."
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees. What we list is what you pay. Stripe's processing fees are industry-standard and clearly disclosed. The only surprise might be if your bank charges for incoming transfers (rare)."
      },
      {
        q: "What are the cancellation fees?",
        a: "There are no cancellation fees. You can cancel your bounty anytime before approving a submission. Your card is only charged when you accept a hunter's completed work."
      }
    ]
  },
  {
    category: "Shipping & Physical Items",
    icon: Truck,
    questions: [
      {
        q: "How does shipping work?",
        a: "If 'Hunter purchases item' is enabled, the poster provides shipping details after approving the find. The hunter purchases the item, ships it with tracking, and updates the bounty with tracking info. Payout happens after confirmed delivery."
      },
      {
        q: "Who pays for shipping?",
        a: "Shipping costs should be factored into the bounty terms. Posters can include shipping in the 'item budget' or specify it separately. Clarify this when posting to avoid confusion."
      },
      {
        q: "What if the item is damaged in shipping?",
        a: "We recommend hunters use tracked AND insured shipping for valuable items. If there's a damage dispute, open a support ticket with photos. Resolution depends on circumstances—insurance claims may apply."
      },
      {
        q: "What if the item never arrives?",
        a: "Tracking is crucial. If tracking shows delivery but the poster claims non-receipt, our support team investigates. If tracking shows the item is lost, the carrier's insurance or dispute process applies."
      },
      {
        q: "Do all bounties require shipping?",
        a: "No! Many bounties are for LEADS—just finding where to buy something. The poster might purchase directly from the seller the hunter found. Check the bounty details: 'Hunter purchases item' means physical shipping is involved."
      }
    ]
  },
  {
    category: "Trust & Safety",
    icon: Shield,
    questions: [
      {
        q: "How do I know hunters are legit?",
        a: "All hunters must complete identity verification through Stripe before claiming bounties. Verified hunters display a checkmark badge. Plus, you review all claims before releasing payment—you're never paying blindly."
      },
      {
        q: "How do I know posters will pay?",
        a: "Funds are held in escrow BEFORE the bounty goes live. The money is already secured—it's not a promise to pay. When you deliver, the funds are released. No chasing payments."
      },
      {
        q: "What if someone tries to scam me?",
        a: "Report them immediately. Our team reviews all reports and takes action including suspensions and bans. The escrow system protects both parties—no one gets money or items without proper verification."
      },
      {
        q: "Can I message users before committing?",
        a: "Yes! Use the messaging system to ask clarifying questions before claiming a bounty or accepting a claim. Communication is key to smooth transactions."
      },
      {
        q: "What happens to scammers?",
        a: "Account suspension or permanent ban. Verified identity means we know who they are. Repeated violations or fraud attempts are reported appropriately. We take platform integrity seriously."
      }
    ]
  },
  {
    category: "Disputes & Support",
    icon: AlertCircle,
    questions: [
      {
        q: "What if I have a problem with a transaction?",
        a: "Open a dispute from the bounty page or go to Support > Create Ticket. Describe the issue with evidence (screenshots, photos, messages). Our team reviews and responds within 1-2 business days."
      },
      {
        q: "How are disputes resolved?",
        a: "We review evidence from both parties—submitted proof, messages, tracking info, etc. We aim for fair resolution: refunds, partial payments, or determining which party fulfilled their obligations. Most disputes resolve within 14 days."
      },
      {
        q: "Can I report a user?",
        a: "Yes. From their profile or from any bounty/claim page, click 'Report User.' Select the reason (fraud, harassment, spam, etc.) and provide details. All reports are reviewed by our team."
      },
      {
        q: "What if I disagree with a dispute resolution?",
        a: "You can request a review by replying to your support ticket with additional evidence. We want to get it right. For payment disputes, you also have rights through your card issuer (though we prefer resolving in-platform)."
      },
      {
        q: "How long does support take to respond?",
        a: "Most tickets get a first response within 24 hours during business days. Complex disputes may take longer to investigate. You'll receive email notifications when there are updates."
      }
    ]
  },
  {
    category: "Account & Settings",
    icon: Users,
    questions: [
      {
        q: "How do ratings work?",
        a: "After a successful transaction, both parties can rate each other (1-5 stars + optional review). Your average rating displays on your profile. High ratings build trust and attract more/better transactions."
      },
      {
        q: "What is the verified badge?",
        a: "The verified badge means the user completed identity verification through Stripe. For hunters, this is required before claiming bounties. It means we've confirmed their identity—adding accountability to every transaction."
      },
      {
        q: "Can I be both a poster and a hunter?",
        a: "Absolutely! Many users do both. Post bounties for items you need, hunt for bounties you can help with. Same account, both roles."
      },
      {
        q: "How do I change my username or email?",
        a: "Go to Profile > Settings to update your display name, username, and other details. Email changes may require re-verification for security."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Profile > Settings > Danger Zone. Note: Active bounties must be resolved first, and transaction records are retained for legal/tax compliance as required by law."
      },
      {
        q: "What notifications will I receive?",
        a: "You'll get notified about: new claims on your bounties, claim approvals/rejections, messages, dispute updates, and payout confirmations. Manage notification preferences in your profile settings."
      }
    ]
  }
];

// Quick stats for hero section
const quickStats = [
  { label: "Poster Platform Fee", value: "$0", subtext: "Only pay Stripe processing" },
  { label: "Hunter Fee", value: "$2 + 5%", subtext: "Deducted from payouts" },
  { label: "Payout Hold", value: "7 days", subtext: "Then automatic transfer" },
  { label: "Cancellation", value: "Free", subtext: "Cancel anytime" },
];

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>FAQ - BountyBay Help Center</title>
        <meta name="description" content="Everything you need to know about BountyBay. Learn about fees, payments, claiming bounties, shipping, disputes, and more." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Help Center
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about buying and selling on BountyBay.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm font-medium text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {faqData.map((section, index) => (
              <a
                key={index}
                href={`#${section.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 text-sm rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                {section.category}
              </a>
            ))}
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqData.map((section, sectionIndex) => {
              const IconComponent = section.icon;
              return (
                <div 
                  key={sectionIndex} 
                  id={section.category.toLowerCase().replace(/\s+/g, '-')}
                  className="bg-card rounded-lg border border-border p-6 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {section.category}
                    </h2>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((item, itemIndex) => (
                      <AccordionItem 
                        key={itemIndex} 
                        value={`${sectionIndex}-${itemIndex}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-left hover:no-underline hover:text-primary text-foreground">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          {/* Still need help */}
          <div className="mt-12 text-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is ready to help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild>
                <Link to="/support">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@bountybay.co">Email Us</a>
              </Button>
            </div>
          </div>

          {/* Legal links */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By using BountyBay, you agree to our{' '}
              <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

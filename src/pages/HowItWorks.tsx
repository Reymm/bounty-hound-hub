import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Users,
  Plus,
  Eye,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FREE_POST_THRESHOLD } from '@/lib/constants';

const HowItWorks = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>How It Works | BountyBay</title>
        <meta name="description" content="Learn how BountyBay connects people seeking hard-to-find items with hunters who can find them. Simple, safe, and pay only when successful." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-success/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How BountyBay Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We connect people looking for hard-to-find items with a community of hunters 
            who get paid to find them. Simple, safe, and you only pay when successful.
          </p>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* For Posters */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary rounded-lg">
                    <FileText className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">For Posters</h2>
                </div>
                <p className="text-muted-foreground mb-8">
                  Looking for something specific? Post a bounty and let our community find it for you.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Post Your Bounty</h3>
                      <p className="text-sm text-muted-foreground">
                        Describe what you're looking for, upload photos if you have them, and set your reward amount.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Hunters Search</h3>
                      <p className="text-sm text-muted-foreground">
                        Our community of verified hunters will search for your item and submit claims when they find it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Review & Accept</h3>
                      <p className="text-sm text-muted-foreground">
                        Review submissions, ask questions, and accept when you're satisfied with what was found.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Pay on Success</h3>
                      <p className="text-sm text-muted-foreground">
                        Your payment is only released when you accept a submission. No find = no charge.
                      </p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full mt-8">
                  <Link to={user ? "/post" : "/auth?tab=signup"}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Bounty
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* For Hunters */}
            <Card className="border-2 border-success/20 bg-success/5">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-success rounded-lg">
                    <Search className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">For Hunters</h2>
                </div>
                <p className="text-muted-foreground mb-8">
                  Good at finding things? Get paid to help people locate hard-to-find items.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Browse Bounties</h3>
                      <p className="text-sm text-muted-foreground">
                        Explore active bounties and find ones that match your expertise or interests.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Verify Your Identity</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete a quick ID verification (takes ~5 minutes) to start claiming bounties.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Submit Your Find</h3>
                      <p className="text-sm text-muted-foreground">
                        When you find the item, submit proof with photos and details for the poster to review.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-warning text-warning-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      $
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Get Paid</h3>
                      <p className="text-sm text-muted-foreground">
                        Once accepted, receive your payout directly to your bank account or debit card.
                      </p>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full mt-8 border-success text-success hover:bg-success hover:text-success-foreground">
                  <Link to="/bounties">
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Bounties
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Built for Trust & Safety</h2>
            <p className="text-muted-foreground">
              We've designed every step to protect both posters and hunters.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">ID-Verified Hunters</h3>
                <p className="text-sm text-muted-foreground">
                  All hunters must verify their identity with a government ID before claiming bounties.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-10 w-10 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Secure Escrow</h3>
                <p className="text-sm text-muted-foreground">
                  Funds are held securely and only released when you accept a submission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-10 w-10 text-warning mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Dispute Resolution</h3>
                <p className="text-sm text-muted-foreground">
                  Our support team helps resolve any issues between posters and hunters.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Transparency Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">How Payment Works</h2>
            </div>
            <p className="text-muted-foreground">
              Transparent, secure, and you're always in control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-primary">Under ${FREE_POST_THRESHOLD}</span>
                </div>
                <h3 className="font-semibold text-foreground text-center mb-3">Card Saved Only</h3>
                <p className="text-sm text-muted-foreground text-center">
                  For smaller bounties, we simply save your payment method securely. 
                  You're <strong>only charged when you accept a claim</strong> and the bounty is completed.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-warning/30 bg-warning/5">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-warning">${FREE_POST_THRESHOLD}+</span>
                </div>
                <h3 className="font-semibold text-foreground text-center mb-3">Authorization Hold</h3>
                <p className="text-sm text-muted-foreground text-center">
                  For larger bounties, we place an authorization hold on your card. 
                  This reserves the funds but <strong>you're still only charged upon acceptance</strong>.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
            <p className="text-lg font-medium text-foreground">
              ✓ No find = No charge. You're never billed unless you accept a claim.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cancel anytime before acceptance with no fees for bounties under ${FREE_POST_THRESHOLD}.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're looking for something rare or ready to help others find what they need, 
            BountyBay makes it simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to={user ? "/post" : "/auth?tab=signup"}>
                <Plus className="h-5 w-5 mr-2" />
                Post a Bounty
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/bounties">
                <Search className="h-5 w-5 mr-2" />
                Start Hunting
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;

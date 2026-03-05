import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to BountyBay
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Delete Your BountyBay Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              To delete your BountyBay account and all associated data, follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Sign in to your BountyBay account</li>
              <li>Go to <strong>Settings</strong> (tap your profile icon, then Settings)</li>
              <li>Scroll to the <strong>Danger Zone</strong> section</li>
              <li>Tap <strong>"Delete Account"</strong> and confirm</li>
            </ol>

            <h3 className="text-foreground font-semibold pt-2">What gets deleted</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Your profile, username, and avatar</li>
              <li>All bounties you posted</li>
              <li>All submissions and claims</li>
              <li>Messages and notifications</li>
              <li>Ratings and reviews</li>
              <li>Saved bounties and referral data</li>
            </ul>

            <h3 className="text-foreground font-semibold pt-2">What may be retained</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Completed financial transaction records (required by law)</li>
              <li>Data necessary for fraud prevention and legal compliance</li>
            </ul>

            <h3 className="text-foreground font-semibold pt-2">Important</h3>
            <p>
              Account deletion is blocked if you have active bounties with escrow funds or
              in-progress claims. Please resolve any outstanding transactions before requesting
              deletion.
            </p>
            <p>
              Account deletion is permanent and cannot be undone. All data is removed immediately
              upon confirmation.
            </p>

            <div className="pt-4">
              <p className="text-xs">
                Need help? Contact us at{" "}
                <a href="mailto:support@bountybay.co" className="text-primary hover:underline">
                  support@bountybay.co
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

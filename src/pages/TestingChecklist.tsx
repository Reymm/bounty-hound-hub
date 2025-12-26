import { useEffect } from "react";

export const TestingChecklist = () => {
  useEffect(() => {
    // Auto-trigger print dialog when page loads
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-4">
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; background: white !important; }
            @page { margin: 0.4in; size: letter; }
            .no-print { display: none !important; }
          }
          @media screen {
            body { background: #f5f5f5; }
          }
        `}
      </style>

      <div className="max-w-4xl mx-auto bg-white print:max-w-none">
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold">🧪 BountyBay Payout Testing Checklist</h1>
          <p className="text-sm mt-2">
            <strong>Test Card:</strong> 4242 4242 4242 4242 | <strong>Exp:</strong> Any future | <strong>CVC:</strong> Any 3 digits
          </p>
        </div>

        {/* Test Accounts */}
        <section className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-3">Test Accounts Needed</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Account</th>
                <th className="border border-gray-300 p-2 text-left">Country</th>
                <th className="border border-gray-300 p-2 text-left">Setup Required</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-300 p-2">Poster-CA</td><td className="border border-gray-300 p-2">Canada</td><td className="border border-gray-300 p-2">None</td></tr>
              <tr><td className="border border-gray-300 p-2">Poster-US</td><td className="border border-gray-300 p-2">USA</td><td className="border border-gray-300 p-2">None</td></tr>
              <tr><td className="border border-gray-300 p-2">Hunter-CA</td><td className="border border-gray-300 p-2">Canada</td><td className="border border-gray-300 p-2">Complete Stripe Connect onboarding</td></tr>
              <tr><td className="border border-gray-300 p-2">Hunter-US</td><td className="border border-gray-300 p-2">USA</td><td className="border border-gray-300 p-2">Set payout email in profile</td></tr>
            </tbody>
          </table>
        </section>

        {/* Combination 1: CA → CA */}
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold bg-green-100 p-2 mb-2">1️⃣ CANADA → CANADA (Stripe Connect Auto Payout)</h2>
          
          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">A) Lead Only Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty (no shipping)</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-CA claims with proof</div>
              <div>☐ Poster-CA accepts claim</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>

          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">B) Item Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty (requires shipping)</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-CA claims with proof</div>
              <div>☐ Poster-CA accepts, provides shipping address</div>
              <div>☐ Hunter-CA adds tracking number</div>
              <div>☐ Poster-CA confirms delivery</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>

          <div className="ml-4">
            <h3 className="font-bold text-sm mb-1">C) Purchase & Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty (hunter purchases item)</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-CA claims</div>
              <div>☐ Poster-CA accepts, provides shipping</div>
              <div>☐ <strong>Poster-CA sends additional funds via "Send Funds" button</strong></div>
              <div>☐ Hunter-CA ships, adds tracking</div>
              <div>☐ Poster-CA confirms delivery</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>
        </section>

        {/* Combination 2: CA → US */}
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold bg-yellow-100 p-2 mb-2">2️⃣ CANADA → USA (Manual Payout via PayPal/Wise)</h2>
          
          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">A) Lead Only Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-US claims with proof</div>
              <div>☐ Poster-CA accepts claim</div>
              <div>☐ ✅ Admin sends manual payout to Hunter-US payout email</div>
            </div>
          </div>

          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">B) Item Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty (requires shipping)</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-US claims with proof</div>
              <div>☐ Poster-CA accepts, provides shipping address</div>
              <div>☐ Hunter-US adds tracking number</div>
              <div>☐ Poster-CA confirms delivery</div>
              <div>☐ ✅ Admin sends manual payout</div>
            </div>
          </div>

          <div className="ml-4">
            <h3 className="font-bold text-sm mb-1">C) Purchase & Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-CA creates bounty (hunter purchases)</div>
              <div>☐ Poster-CA pays with test card</div>
              <div>☐ Hunter-US claims</div>
              <div>☐ Poster-CA accepts, provides shipping</div>
              <div>☐ <strong>Poster-CA sends additional funds</strong></div>
              <div>☐ Hunter-US ships, adds tracking</div>
              <div>☐ Poster-CA confirms delivery</div>
              <div>☐ ✅ Admin sends manual payout</div>
            </div>
          </div>
        </section>

        {/* Combination 3: US → CA */}
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold bg-green-100 p-2 mb-2">3️⃣ USA → CANADA (Stripe Connect Auto Payout)</h2>
          
          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">A) Lead Only Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-CA claims with proof</div>
              <div>☐ Poster-US accepts claim</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>

          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">B) Item Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty (requires shipping)</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-CA claims with proof</div>
              <div>☐ Poster-US accepts, provides shipping</div>
              <div>☐ Hunter-CA adds tracking</div>
              <div>☐ Poster-US confirms delivery</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>

          <div className="ml-4">
            <h3 className="font-bold text-sm mb-1">C) Purchase & Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty (hunter purchases)</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-CA claims</div>
              <div>☐ Poster-US accepts, provides shipping</div>
              <div>☐ <strong>Poster-US sends additional funds</strong></div>
              <div>☐ Hunter-CA ships, adds tracking</div>
              <div>☐ Poster-US confirms delivery</div>
              <div>☐ ✅ Verify payout via Stripe Connect</div>
            </div>
          </div>
        </section>

        {/* Combination 4: US → US */}
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold bg-yellow-100 p-2 mb-2">4️⃣ USA → USA (Manual Payout via PayPal/Wise)</h2>
          
          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">A) Lead Only Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-US claims with proof</div>
              <div>☐ Poster-US accepts claim</div>
              <div>☐ ✅ Admin sends manual payout</div>
            </div>
          </div>

          <div className="ml-4 mb-4">
            <h3 className="font-bold text-sm mb-1">B) Item Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty (requires shipping)</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-US claims with proof</div>
              <div>☐ Poster-US accepts, provides shipping</div>
              <div>☐ Hunter-US adds tracking</div>
              <div>☐ Poster-US confirms delivery</div>
              <div>☐ ✅ Admin sends manual payout</div>
            </div>
          </div>

          <div className="ml-4">
            <h3 className="font-bold text-sm mb-1">C) Purchase & Delivery Bounty</h3>
            <div className="text-sm space-y-1">
              <div>☐ Poster-US creates bounty (hunter purchases)</div>
              <div>☐ Poster-US pays with test card</div>
              <div>☐ Hunter-US claims</div>
              <div>☐ Poster-US accepts, provides shipping</div>
              <div>☐ <strong>Poster-US sends additional funds</strong></div>
              <div>☐ Hunter-US ships, adds tracking</div>
              <div>☐ Poster-US confirms delivery</div>
              <div>☐ ✅ Admin sends manual payout</div>
            </div>
          </div>
        </section>

        {/* Send Additional Funds Test */}
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold bg-blue-100 p-2 mb-2">💰 Send Additional Funds Test</h2>
          <div className="ml-4 text-sm space-y-1">
            <div>☐ Go to bounty detail page as poster</div>
            <div>☐ Click "Claims" tab</div>
            <div>☐ Click "Send Additional Funds" button</div>
            <div>☐ Enter amount (e.g., $12 for shipping)</div>
            <div>☐ Complete Stripe payment with test card</div>
            <div>☐ ✅ Verify escrow transaction created in database</div>
          </div>
        </section>

        {/* Summary */}
        <section className="border-t-2 border-black pt-4">
          <p className="text-sm"><strong>Total Tests:</strong> 12 bounty flows + 1 additional funds test = 13 tests</p>
          <p className="text-sm mt-2"><strong>Green sections:</strong> Stripe Connect auto payout | <strong>Yellow sections:</strong> Manual payout required</p>
        </section>

        {/* Print button - hidden when printing */}
        <div className="no-print mt-8 text-center">
          <button 
            onClick={() => window.print()} 
            className="bg-black text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-gray-800"
          >
            🖨️ Print This Checklist
          </button>
          <p className="mt-2 text-gray-500 text-sm">Or press Ctrl+P / Cmd+P</p>
        </div>
      </div>
    </div>
  );
};

export default TestingChecklist;

import { useEffect } from "react";

const Letterhead = () => {
  useEffect(() => {
    // Auto-trigger print dialog when page loads
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            @page { margin: 0.5in; }
          }
        `}
      </style>
      
      {/* Letterhead Header */}
      <div className="max-w-[8.5in] mx-auto">
        <div className="border-b-4 border-primary pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">
                BountyBay Inc.
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connecting seekers with finders
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Montmartre, Saskatchewan</p>
              <p>Canada S0G 3M0</p>
              <p className="mt-2">Phone: 306-580-3765</p>
              <p>Email: matt@bountybay.co</p>
              <p>Web: bountybay.co</p>
            </div>
          </div>
        </div>

        {/* Content Area - Large blank space for the LOA */}
        <div className="min-h-[9in] print:min-h-[8in]">
          {/* This is where the LOA content will go when printed */}
        </div>

        {/* Footer */}
        <div className="border-t border-muted pt-4 mt-auto text-center text-xs text-muted-foreground">
          <p>BountyBay Inc. • Montmartre, SK S0G 3M0 • bountybay.co</p>
        </div>
      </div>

      {/* Print instructions - hidden when printing */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg print:hidden max-w-sm">
        <p className="font-semibold mb-2">Instructions:</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Print this page (Ctrl+P / Cmd+P)</li>
          <li>Use this letterhead for the PayPal LOA</li>
          <li>Fill in the form details by hand</li>
          <li>Sign and submit to PayPal</li>
        </ol>
      </div>
    </div>
  );
};

export default Letterhead;

import { useRef, useEffect, useState } from 'react';

interface PayPalButtonsProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

interface Window {
  paypal: any;
}

declare const window: Window;

export default function PayPalButtons({ 
  amount, 
  currency, 
  intent = 'capture',
  onSuccess,
  onError,
  onCancel 
}: PayPalButtonsProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Get PayPal client ID
    fetch('/api/paypal-config')
      .then(res => res.json())
      .then(data => setClientId(data.clientId))
      .catch(err => {
        console.error('Failed to get PayPal config:', err);
        setError('PayPal configuration error');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!clientId || !paypalRef.current) return;

    const initializePayPal = async () => {
      try {
        // Try server-side redirect approach immediately (bypass JavaScript SDK issues)
        console.log('Using server-side PayPal checkout');
        
        const response = await fetch('/api/paypal/redirect-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency })
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.approveUrl) {
          // Create a styled PayPal button that redirects to PayPal's hosted checkout
          paypalRef.current!.innerHTML = `
            <div class="space-y-3">
              <button 
                onclick="window.location.href='${data.approveUrl}'"
                class="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                style="background: linear-gradient(135deg, #0070ba 0%, #005ea6 100%); min-height: 48px;"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.78 2h8.525c2.312 0 3.972.669 4.94 1.983.905 1.23.94 2.97.107 5.17-.166.438-.359.838-.573 1.2-.672 1.13-1.547 1.93-2.603 2.38-.906.387-1.97.58-3.166.58H9.65a.859.859 0 0 0-.835.673l-.951 6.017a.641.641 0 0 1-.633.533h-.003Z"/>
                  <path d="M16.986 6.08c.065.543.012 1.05-.164 1.526-.69 1.87-2.357 2.81-4.952 2.81H9.19a.859.859 0 0 0-.835.673l-1.06 6.72a.641.641 0 0 1-.633.533H4.47a.641.641 0 0 1-.633-.74l.838-5.302a.859.859 0 0 1 .835-.673h2.682c2.595 0 4.262-.94 4.952-2.81.176-.476.229-.983.164-1.526l-.322-2.04Z"/>
                </svg>
                <span style="font-size: 16px; font-weight: 600;">Pay with PayPal</span>
              </button>
              <div class="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Secure payment powered by PayPal</span>
              </div>
            </div>
          `;
          setIsLoading(false);
        } else {
          throw new Error('No approval URL received from PayPal');
        }
      } catch (err) {
        console.error('PayPal initialization error:', err);
        setError('PayPal checkout is currently unavailable. Please try again later.');
        setIsLoading(false);
      }
    };

    initializePayPal();
  }, [clientId, amount, currency]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
          <span className="font-medium">Payment Error</span>
        </div>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg mb-3"></div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span>Loading PayPal checkout...</span>
        </div>
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full" />;
}
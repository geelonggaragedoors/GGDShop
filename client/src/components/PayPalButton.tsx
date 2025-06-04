import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  orderData?: any;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export default function PayPalButton({ 
  amount, 
  currency, 
  intent = 'capture',
  orderData,
  onSuccess,
  onError,
  onCancel 
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayPalPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/paypal/redirect-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, orderData })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      setError('PayPal checkout is currently unavailable. Please try again.');
      setIsLoading(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <span className="font-medium">Payment Error</span>
        </div>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <Button 
          onClick={() => {
            setError(null);
            handlePayPalPayment();
          }}
          className="mt-3 w-full"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <Button 
        onClick={handlePayPalPayment}
        className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            Redirecting to PayPal...
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.78 2h8.525c2.312 0 3.972.669 4.94 1.983.905 1.23.94 2.97.107 5.17-.166.438-.359.838-.573 1.2-.672 1.13-1.547 1.93-2.603 2.38-.906.387-1.97.58-3.166.58H9.65a.859.859 0 0 0-.835.673l-.951 6.017a.641.641 0 0 1-.633.533h-.003Z"/>
              <path d="M16.986 6.08c.065.543.012 1.05-.164 1.526-.69 1.87-2.357 2.81-4.952 2.81H9.19a.859.859 0 0 0-.835.673l-1.06 6.72a.641.641 0 0 1-.633.533H4.47a.641.641 0 0 1-.633-.74l.838-5.302a.859.859 0 0 1 .835-.673h2.682c2.595 0 4.262-.94 4.952-2.81.176-.476.229-.983.164-1.526l-.322-2.04Z"/>
            </svg>
            Pay with PayPal
          </>
        )}
      </Button>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <span>Secure payment powered by PayPal</span>
      </div>
    </div>
  );
}
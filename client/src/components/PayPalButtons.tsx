import React, { useEffect, useRef, useState } from 'react';

interface Window {
  paypal: any;
}

declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonsProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButtons({ amount, currency, intent }: PayPalButtonsProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get PayPal config
        const configResponse = await fetch('/api/paypal-config');
        const config = await configResponse.json();

        // Remove existing PayPal scripts
        document.querySelectorAll('script[src*="paypal.com/sdk"]').forEach(s => s.remove());
        
        // Load PayPal JavaScript SDK
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=${intent}`;
        script.async = true;
        
        script.onload = () => {
          console.log('PayPal SDK loaded');
          console.log('window.paypal available:', !!window.paypal);
          console.log('window.paypal.Buttons available:', !!window.paypal?.Buttons);
          
          // Check if PayPal SDK loaded properly
          if (window.paypal && window.paypal.Buttons) {
            try {
              // Render PayPal Buttons
              window.paypal.Buttons({
                createOrder: async () => {
                  const response = await fetch('/api/paypal/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, currency, intent })
                  });
                  const data = await response.json();
                  return data.id;
                },
                onApprove: async (data: any) => {
                  const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const result = await response.json();
                  console.log('Payment successful:', result);
                  return result;
                },
                onError: (err: any) => {
                  console.error('PayPal error:', err);
                  setError('Payment failed. Please try again.');
                }
              }).render(paypalRef.current);

              setIsLoading(false);
            } catch (err) {
              console.error('Error rendering PayPal buttons:', err);
              setError('Failed to initialize PayPal buttons');
              setIsLoading(false);
            }
          } else {
            console.error('PayPal SDK not properly loaded');
            console.log('window.paypal object:', window.paypal);
            setError('PayPal SDK failed to load properly. Please check your credentials.');
            setIsLoading(false);
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load PayPal SDK script');
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('PayPal initialization error:', error);
        setError('PayPal initialization failed');
        setIsLoading(false);
      }
    };

    loadPayPal();
  }, [amount, currency, intent]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-red-500 text-xs mt-1">
          This may indicate an issue with the PayPal credentials or account configuration.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <p className="text-gray-500 text-sm mt-2">Loading PayPal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={paypalRef} id="paypal-button-container"></div>
      <div ref={messageRef} id="paypal-messages"></div>
    </div>
  );
}
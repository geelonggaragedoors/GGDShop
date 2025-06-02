import React, { useEffect, useRef, useState } from 'react';

interface PayPalButtonsProps {
  amount: string;
  currency: string;
  intent: string;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PayPalButtons({ amount, currency, intent }: PayPalButtonsProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
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
        
        // Test with a more complete PayPal SDK URL including components
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=capture&components=buttons`;
        script.async = true;
        
        script.onload = () => {
          console.log('PayPal SDK script loaded');
          console.log('window.paypal exists:', !!window.paypal);
          console.log('PayPal object type:', typeof window.paypal);
          
          // Give PayPal SDK more time to fully initialize
          setTimeout(() => {
            console.log('After delay - PayPal Buttons exists:', !!window.paypal?.Buttons);
            console.log('PayPal object properties:', Object.keys(window.paypal || {}));
            
            if (window.paypal && typeof window.paypal.Buttons === 'function') {
              try {
                window.paypal.Buttons({
                  createOrder: async () => {
                    const response = await fetch('/api/paypal/order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount, currency, intent: 'capture' })
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
                    console.error('PayPal payment error:', err);
                    setError('Payment failed. Please try again.');
                  }
                }).render(paypalRef.current);

                setIsLoading(false);
              } catch (err) {
                console.error('Error initializing PayPal buttons:', err);
                setError('Failed to initialize PayPal buttons');
                setIsLoading(false);
              }
            } else {
              console.error('PayPal Buttons function not available');
              setError('PayPal integration not available. This may be due to domain restrictions.');
              setIsLoading(false);
            }
          }, 3000);
        };
        
        script.onerror = (err) => {
          console.error('PayPal SDK script failed to load:', err);
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
        <p className="text-red-600 text-sm font-medium">PayPal Payment Error</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <p className="text-gray-600 text-xs mt-2">
          Try opening this page in a new browser tab outside of the development environment.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-12 bg-blue-100 rounded mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
        <p className="text-gray-500 text-sm mt-2">Loading PayPal checkout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={paypalRef} id="paypal-button-container"></div>
    </div>
  );
}
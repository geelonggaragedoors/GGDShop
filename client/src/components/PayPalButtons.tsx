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
        
        // Create script with proper initialization
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=capture&components=buttons`;
        script.async = true;
        
        script.onload = () => {
          console.log('PayPal script loaded');
          
          // Wait for PayPal SDK to fully initialize
          const checkPayPal = () => {
            if (window.paypal && typeof window.paypal.Buttons === 'function') {
              console.log('PayPal Buttons ready');
              
              window.paypal.Buttons({
                createOrder: async () => {
                  try {
                    const response = await fetch('/api/paypal/order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount, currency, intent: 'capture' })
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to create order');
                    }
                    
                    const data = await response.json();
                    console.log('Order created:', data.id);
                    return data.id;
                  } catch (err) {
                    console.error('Create order error:', err);
                    throw err;
                  }
                },
                
                onApprove: async (data: any) => {
                  try {
                    console.log('Payment approved:', data.orderID);
                    
                    const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to capture payment');
                    }
                    
                    const result = await response.json();
                    console.log('Payment captured:', result);
                    
                    // Show success message
                    alert('Payment successful!');
                    return result;
                  } catch (err) {
                    console.error('Capture payment error:', err);
                    setError('Payment processing failed');
                  }
                },
                
                onError: (err: any) => {
                  console.error('PayPal button error:', err);
                  setError('Payment failed. Please try again.');
                },
                
                onCancel: (data: any) => {
                  console.log('Payment cancelled:', data);
                }
                
              }).render(paypalRef.current).then(() => {
                console.log('PayPal buttons rendered successfully');
                setIsLoading(false);
              }).catch((err: any) => {
                console.error('PayPal render error:', err);
                setError('Failed to load PayPal buttons');
                setIsLoading(false);
              });
              
            } else {
              console.log('PayPal not ready yet, retrying...');
              setTimeout(checkPayPal, 100);
            }
          };
          
          // Start checking for PayPal initialization
          checkPayPal();
        };
        
        script.onerror = (err) => {
          console.error('PayPal script failed to load:', err);
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
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-blue-600 text-sm underline"
        >
          Try Again
        </button>
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
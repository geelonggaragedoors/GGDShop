import React, { useEffect, useRef, useState } from "react";

interface PayPalButtonsProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButtons({
  amount,
  currency,
  intent,
}: PayPalButtonsProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPal = async () => {
      try {
        // Get client ID from server
        const response = await fetch('/api/paypal-config');
        const config = await response.json();
        
        if (!config.clientId) {
          throw new Error('PayPal client ID not configured');
        }

        // Remove existing PayPal scripts
        document.querySelectorAll('script[src*="paypal.com/sdk"]').forEach(s => s.remove());
        
        // Load PayPal SDK following official documentation
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=${intent}&components=buttons,messages&enable-funding=venmo,paylater`;
        script.async = true;
        
        script.onload = () => {
          if (window.paypal && paypalRef.current) {
            // Render PayPal Buttons using official SDK approach
            window.paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
              },
              createOrder: async () => {
                const orderResponse = await fetch('/paypal/order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: amount,
                    currency: currency,
                    intent: intent
                  })
                });
                const orderData = await orderResponse.json();
                return orderData.id;
              },
              onApprove: async (data: any) => {
                const captureResponse = await fetch(`/paypal/order/${data.orderID}/capture`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                const result = await captureResponse.json();
                alert('Payment completed successfully!');
                console.log('Payment captured:', result);
              },
              onError: (err: any) => {
                console.error('PayPal error:', err);
                alert('Payment failed. Please try again.');
              },
              onCancel: () => {
                console.log('Payment cancelled by user');
              }
            }).render(paypalRef.current);

            // Render Pay Later messages if available
            if (window.paypal.Messages) {
              const messageContainer = document.createElement('div');
              messageContainer.className = 'paypal-messages mt-3';
              paypalRef.current.appendChild(messageContainer);
              
              window.paypal.Messages({
                amount: parseFloat(amount),
                placement: 'payment',
                style: {
                  layout: 'text'
                }
              }).render(messageContainer);
            }

            setIsLoading(false);
          } else {
            setError('PayPal SDK failed to initialize');
            setIsLoading(false);
          }
        };
        
        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        setError('PayPal initialization failed');
        setIsLoading(false);
      }
    };

    loadPayPal();
  }, [amount, currency, intent]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <p className="text-red-700 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div ref={paypalRef} className="min-h-[60px]">
        {isLoading && (
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    paypal: any;
  }
}
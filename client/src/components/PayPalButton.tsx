import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButton({ 
  amount, 
  currency, 
  intent = 'capture',
  onSuccess,
  onError,
  onCancel 
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);

  // Get PayPal client ID
  useEffect(() => {
    fetch('/api/paypal-config')
      .then(res => res.json())
      .then(data => setClientId(data.clientId))
      .catch(err => {
        console.error('Failed to get PayPal config:', err);
        setError('PayPal configuration error');
        setIsLoading(false);
      });
  }, []);

  // Initialize PayPal - prioritize server-side redirect for reliability
  useEffect(() => {
    if (!clientId || !paypalRef.current) return;

    // Immediately use server-side redirect approach for better reliability
    console.log('Using server-side PayPal redirect approach');
    setShowFallback(true);
    setIsLoading(false);
    
    // Alternative: Try SDK approach with quick timeout
    /*
    const timeoutId = setTimeout(() => {
      console.log('PayPal SDK timeout, switching to fallback');
      setShowFallback(true);
      setIsLoading(false);
    }, 3000);

    const loadPayPalSDK = () => {
      if (window.paypal && window.paypal.Buttons) {
        clearTimeout(timeoutId);
        initializePayPalButtons();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}`;
      script.async = true;
      
      script.onload = () => {
        clearTimeout(timeoutId);
        setTimeout(() => {
          if (window.paypal && window.paypal.Buttons) {
            initializePayPalButtons();
          } else {
            setShowFallback(true);
            setIsLoading(false);
          }
        }, 500);
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        setShowFallback(true);
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    loadPayPalSDK();
    */

    const initializePayPalButtons = () => {
      if (!window.paypal || !window.paypal.Buttons) {
        console.error('PayPal Buttons not available, using fallback');
        setShowFallback(true);
        setIsLoading(false);
        return;
      }

      try {
        window.paypal.Buttons({
          createOrder: async () => {
            try {
              const response = await fetch('/paypal/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  amount: amount,
                  currency: currency,
                  intent: intent 
                })
              });
              
              if (!response.ok) {
                console.error('PayPal order creation failed:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const orderData = await response.json();
              console.log('PayPal order created:', orderData.id);
              return orderData.id;
            } catch (error) {
              console.error('Error creating PayPal order:', error);
              // Fall back to server-side redirect
              setShowFallback(true);
              setIsLoading(false);
              throw error;
            }
          },
          
          onApprove: async (data: any) => {
            try {
              const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const orderData = await response.json();
              console.log('Payment successful:', orderData);
              
              if (onSuccess) {
                onSuccess(orderData);
              }
            } catch (error) {
              console.error('Error capturing PayPal payment:', error);
              if (onError) {
                onError(error);
              }
            }
          },
          
          onCancel: (data: any) => {
            console.log('Payment cancelled:', data);
            if (onCancel) {
              onCancel();
            }
          },
          
          onError: (err: any) => {
            console.error('PayPal payment error:', err);
            if (onError) {
              onError(err);
            }
          },
          
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          }
        }).render(paypalRef.current);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing PayPal buttons:', error);
        setShowFallback(true);
        setIsLoading(false);
      }
    };

    loadPayPalSDK();
  }, [clientId, amount, currency, intent]);

  // Fallback PayPal redirect handler
  const handleFallbackPayment = async () => {
    try {
      setIsLoading(true);
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
        window.location.href = data.approveUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (error) {
      console.error('Fallback PayPal error:', error);
      setError('PayPal checkout is currently unavailable');
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
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

  if (showFallback) {
    return (
      <div className="w-full space-y-3">
        <Button 
          onClick={handleFallbackPayment}
          className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
          disabled={isLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.78 2h8.525c2.312 0 3.972.669 4.94 1.983.905 1.23.94 2.97.107 5.17-.166.438-.359.838-.573 1.2-.672 1.13-1.547 1.93-2.603 2.38-.906.387-1.97.58-3.166.58H9.65a.859.859 0 0 0-.835.673l-.951 6.017a.641.641 0 0 1-.633.533h-.003Z"/>
            <path d="M16.986 6.08c.065.543.012 1.05-.164 1.526-.69 1.87-2.357 2.81-4.952 2.81H9.19a.859.859 0 0 0-.835.673l-1.06 6.72a.641.641 0 0 1-.633.533H4.47a.641.641 0 0 1-.633-.74l.838-5.302a.859.859 0 0 1 .835-.673h2.682c2.595 0 4.262-.94 4.952-2.81.176-.476.229-.983.164-1.526l-.322-2.04Z"/>
          </svg>
          Pay with PayPal
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

  return <div ref={paypalRef} className="w-full" />;
}
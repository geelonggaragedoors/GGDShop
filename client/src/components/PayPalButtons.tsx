import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
    const loadPayPalSDK = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get PayPal client ID from server
        const response = await fetch('/api/paypal-config');
        if (!response.ok) {
          throw new Error('Failed to get PayPal configuration');
        }
        
        const config = await response.json();
        if (!config.clientId) {
          throw new Error('PayPal client ID not configured');
        }

        // Remove any existing PayPal scripts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
        existingScripts.forEach(script => script.remove());

        // Clear any existing PayPal global
        if (window.paypal) {
          delete window.paypal;
        }

        // Load PayPal SDK with comprehensive configuration
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}&intent=${intent}&components=buttons,marks,messages&enable-funding=venmo,paylater&disable-funding=card`;
        script.async = true;
        
        script.onload = () => {
          if (window.paypal && window.paypal.Buttons && paypalRef.current) {
            // Clear container
            paypalRef.current.innerHTML = '';
            
            // Render PayPal buttons
            window.paypal.Buttons({
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
                height: 55
              },
              createOrder: async () => {
                try {
                  const orderResponse = await fetch("/paypal/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: amount,
                      currency: currency,
                      intent: intent,
                    }),
                  });
                  
                  if (!orderResponse.ok) {
                    throw new Error(`Failed to create order: ${orderResponse.status}`);
                  }
                  
                  const orderData = await orderResponse.json();
                  return orderData.id;
                } catch (error) {
                  console.error('Error creating PayPal order:', error);
                  throw error;
                }
              },
              onApprove: async (data: any) => {
                try {
                  const captureResponse = await fetch(`/paypal/order/${data.orderID}/capture`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  
                  if (!captureResponse.ok) {
                    throw new Error(`Failed to capture payment: ${captureResponse.status}`);
                  }
                  
                  const orderData = await captureResponse.json();
                  console.log("Payment captured successfully:", orderData);
                  alert("Payment completed successfully!");
                  
                  // You can add additional success handling here
                  // e.g., redirect to success page, clear cart, etc.
                } catch (error) {
                  console.error("Error capturing payment:", error);
                  alert("Payment capture failed. Please contact support.");
                }
              },
              onError: (err: any) => {
                console.error("PayPal error:", err);
                alert("Payment failed. Please try again or use a different payment method.");
              },
              onCancel: (data: any) => {
                console.log("Payment cancelled:", data);
                // Payment was cancelled, user can try again
              }
            }).render(paypalRef.current);

            // Render Pay Later messages if available
            if (window.paypal.Messages) {
              const messagesContainer = document.createElement('div');
              messagesContainer.className = 'paypal-messages mt-4';
              paypalRef.current.appendChild(messagesContainer);
              
              window.paypal.Messages({
                amount: parseFloat(amount),
                placement: 'payment',
                style: {
                  layout: 'text',
                  logo: {
                    type: 'primary',
                    position: 'left'
                  }
                }
              }).render(messagesContainer);
            }

            setIsLoading(false);
          } else {
            throw new Error('PayPal SDK not properly loaded');
          }
        };
        
        script.onerror = () => {
          setError('Failed to load PayPal SDK');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('PayPal initialization error:', error);
        setError(error instanceof Error ? error.message : 'PayPal initialization failed');
        setIsLoading(false);
      }
    };

    loadPayPalSDK();

    return () => {
      // Cleanup when component unmounts
      const scripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
      scripts.forEach(script => script.remove());
    };
  }, [amount, currency, intent]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700 text-sm">PayPal Error: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={paypalRef} className="min-h-[60px]">
        {isLoading && (
          <div className="animate-pulse space-y-3">
            <div className="h-14 bg-gray-200 rounded-lg"></div>
            <div className="h-14 bg-gray-200 rounded-lg"></div>
          </div>
        )}
      </div>
      
      {isLoading && (
        <p className="text-sm text-gray-500 text-center">
          Loading PayPal payment options...
        </p>
      )}
    </div>
  );
}

declare global {
  interface Window {
    paypal: any;
  }
}
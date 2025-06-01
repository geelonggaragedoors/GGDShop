import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function BasicPayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);

  const handlePayPalPayment = async () => {
    try {
      setIsLoading(true);
      
      // Create order on our backend
      const response = await fetch("/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          intent: intent,
        }),
      });
      
      const orderData = await response.json();
      
      if (orderData.id) {
        // Redirect to PayPal for payment
        const approvalUrl = orderData.links.find((link: any) => link.rel === "approve")?.href;
        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          alert("PayPal payment setup failed. Please try again.");
        }
      } else {
        alert("Failed to create PayPal order. Please try again.");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadPayPalScript = async () => {
      try {
        // Get PayPal client ID
        const response = await fetch('/api/paypal-config');
        const config = await response.json();
        
        if (!config.clientId || config.clientId === 'test') {
          console.warn('PayPal client ID not configured properly');
          return;
        }

        // Remove existing PayPal scripts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com"]');
        existingScripts.forEach(script => script.remove());

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=${currency}`;
        script.async = true;
        
        script.onload = () => {
          console.log("PayPal SDK loaded");
          if (window.paypal && window.paypal.Buttons && paypalRef.current) {
            setPaypalLoaded(true);
            
            window.paypal.Buttons({
              createOrder: async () => {
                const response = await fetch("/paypal/order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: amount,
                    currency: currency,
                    intent: intent,
                  }),
                });
                const orderData = await response.json();
                return orderData.id;
              },
              onApprove: async (data: any) => {
                const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
                  method: "POST",
                });
                const orderData = await response.json();
                alert("Payment completed successfully!");
                console.log("Payment captured:", orderData);
              },
              onError: (err: any) => {
                console.error("PayPal error:", err);
                alert("Payment failed. Please try again.");
              },
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
              }
            }).render(paypalRef.current);
          }
        };
        
        script.onerror = () => {
          console.error("Failed to load PayPal SDK");
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error("PayPal initialization error:", error);
      }
    };

    loadPayPalScript();
  }, [amount, currency, intent]);

  return (
    <div className="space-y-4">
      <div ref={paypalRef} className="min-h-[50px]"></div>
      
      {!paypalLoaded && (
        <Button 
          onClick={handlePayPalPayment}
          disabled={isLoading}
          className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
          size="lg"
        >
          {isLoading ? "Processing..." : "Pay with PayPal"}
        </Button>
      )}
    </div>
  );
}

declare global {
  interface Window {
    paypal: any;
  }
}
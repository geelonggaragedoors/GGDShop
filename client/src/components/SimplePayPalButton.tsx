import React, { useEffect, useRef } from "react";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function SimplePayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);

  const createOrder = async () => {
    console.log("Creating PayPal order...");
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    console.log("Order created:", output);
    return output.id;
  };

  const onApprove = async (data: any) => {
    console.log("PayPal payment approved:", data);
    const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const orderData = await response.json();
    console.log("Payment captured:", orderData);
    
    // Handle successful payment here
    alert("Payment completed successfully!");
  };

  const onError = (err: any) => {
    console.error("PayPal payment error:", err);
    alert("Payment failed. Please try again.");
  };

  const onCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
  };

  useEffect(() => {
    const loadPayPalScript = async () => {
      // Remove ALL existing PayPal scripts
      const existingScripts = document.querySelectorAll('script[src*="paypal.com"]');
      existingScripts.forEach(script => script.remove());
      
      // Clear any existing PayPal global
      if (window.paypal) {
        delete window.paypal;
      }

      // Get PayPal client ID from the server
      let clientId = 'test';
      try {
        const response = await fetch('/api/paypal-config');
        if (response.ok) {
          const config = await response.json();
          clientId = config.clientId;
        }
      } catch (error) {
        console.error('Failed to get PayPal config:', error);
      }
      
      console.log('Loading PayPal SDK with client ID:', clientId);
      
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}`;
      script.async = true;
      
      script.onload = () => {
        console.log("PayPal SDK loaded successfully");
        console.log("PayPal object:", window.paypal);
        console.log("PayPal.Buttons:", window.paypal?.Buttons);
        
        if (window.paypal && window.paypal.Buttons && paypalRef.current) {
          // Clear the container first
          paypalRef.current.innerHTML = '';
          
          window.paypal.Buttons({
            createOrder: createOrder,
            onApprove: onApprove,
            onError: onError,
            onCancel: onCancel,
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'paypal'
            }
          }).render(paypalRef.current);
        } else {
          console.error("PayPal Buttons not available");
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load PayPal SDK");
      };
      
      document.head.appendChild(script);
    };

    loadPayPalScript();

    return () => {
      // Cleanup: remove script when component unmounts
      const script = document.querySelector('script[src*="paypal.com/sdk"]');
      if (script) {
        script.remove();
      }
    };
  }, [amount, currency, intent]);

  return (
    <div>
      <div ref={paypalRef} id="paypal-button-container"></div>
    </div>
  );
}

declare global {
  interface Window {
    paypal: any;
  }
}
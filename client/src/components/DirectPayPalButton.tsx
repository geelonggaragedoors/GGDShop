import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function DirectPayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayPalPayment = async () => {
    try {
      setIsLoading(true);
      
      console.log("Creating PayPal order...");
      
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const orderData = await response.json();
      console.log("Order response:", orderData);
      
      if (orderData.id) {
        // Find the approval URL from PayPal links
        const approvalUrl = orderData.links?.find((link: any) => link.rel === "approve")?.href;
        
        if (approvalUrl) {
          console.log("Redirecting to PayPal:", approvalUrl);
          // Redirect to PayPal for payment
          window.location.href = approvalUrl;
        } else {
          console.error("No approval URL found in response");
          alert("PayPal payment setup failed. Please try again.");
        }
      } else {
        console.error("No order ID in response");
        alert("Failed to create PayPal order. Please try again.");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayPalPayment}
      disabled={isLoading}
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <span>Pay with</span>
          <strong>PayPal</strong>
        </div>
      )}
    </Button>
  );
}
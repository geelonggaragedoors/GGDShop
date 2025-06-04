import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import SimpleHeader from "@/components/storefront/simple-header";
import PayPalButton from "@/components/PayPalButton";
import AddressAutocomplete from "@/components/ui/address-autocomplete";

export default function Checkout() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGuestCheckout, setIsGuestCheckout] = useState(!isAuthenticated);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    state: ''
  });

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const handleAddressSelect = (addressData: any) => {
    console.log('Address selected:', addressData);
    const { components } = addressData;
    
    // Map Google Places components to form fields
    const streetAddress = `${components.street_number || ''} ${components.route || ''}`.trim();
    const city = components.locality || '';
    const state = components.administrative_area_level_1 || '';
    const postcode = components.postal_code || '';
    
    // Update form data with address components
    setFormData(prev => ({
      ...prev,
      address: streetAddress,
      city: city,
      state: state.toLowerCase(),
      postcode: postcode
    }));
    
    console.log('Auto-populated address fields:', {
      address: streetAddress,
      city,
      state: state.toLowerCase(),
      postcode
    });
  };

  const validateForm = (showToast = false) => {
    const required = ['firstName', 'lastName', 'email', 'address', 'city', 'postcode', 'state'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    if (missing.length > 0 && showToast) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive"
      });
    }
    return missing.length === 0;
  };

  const isFormValid = validateForm();

  const handlePayPalSuccess = (details: any) => {
    console.log('PayPal payment successful:', details);
    toast({
      title: "Payment Successful",
      description: "Your PayPal payment has been processed successfully.",
    });
    setLocation('/checkout/success');
  };

  const handlePayPalError = (error: any) => {
    console.error('PayPal payment error:', error);
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your PayPal payment. Please try again.",
      variant: "destructive"
    });
  };

  const handleCardPayment = async () => {
    console.log('Card payment button clicked');
    console.log('Form validation result:', validateForm());
    console.log('Form data:', formData);
    
    if (!validateForm(true)) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Starting card payment processing');
    setIsProcessing(true);
    
    try {
      // Create order in database
      const orderData = {
        customerData: formData,
        cartItems,
        shippingMethod,
        paymentMethod: 'card',
        totals: {
          subtotal: cartTotal,
          shipping: shippingCost,
          tax: gst,
          total: finalTotal
        }
      };

      console.log('Creating order in database...');
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { order } = await orderResponse.json();
      console.log('Order created:', order);

      // Simulate card payment processing
      console.log('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order payment status
      await fetch(`/api/orders/${order.id}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid', status: 'processing' })
      });

      // Clear cart
      cartItems.forEach(item => removeFromCart(item.productId));
      
      console.log('Payment successful, redirecting to success page');
      toast({
        title: "Order Confirmed",
        description: "Your order has been successfully placed.",
      });
      setLocation('/checkout/success');
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const shippingCost = shippingMethod === "express" ? 25 : 15;
  const gst = (cartTotal + shippingCost) * 0.1;
  const finalTotal = cartTotal + shippingCost + gst;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleHeader />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shopping
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Guest/Account Section */}
            {!isAuthenticated && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guest-checkout" 
                      checked={isGuestCheckout}
                      onCheckedChange={(checked) => setIsGuestCheckout(checked === true)}
                    />
                    <Label htmlFor="guest-checkout">Checkout as Guest</Label>
                  </div>
                  {!isGuestCheckout && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" asChild>
                          <a href="/api/login">Sign In</a>
                        </Button>
                        <Button asChild>
                          <a href="/api/login">Create Account</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+61 4XX XXX XXX" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="address-autocomplete">Address *</Label>
                  <AddressAutocomplete
                    id="address-autocomplete"
                    placeholder="Start typing your address..."
                    onAddressSelect={handleAddressSelect}
                    defaultValue={formData.address}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      placeholder="Geelong" 
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input 
                      id="postcode" 
                      placeholder="3220" 
                      value={formData.postcode}
                      onChange={(e) => handleInputChange('postcode', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vic">Victoria</SelectItem>
                      <SelectItem value="nsw">New South Wales</SelectItem>
                      <SelectItem value="qld">Queensland</SelectItem>
                      <SelectItem value="wa">Western Australia</SelectItem>
                      <SelectItem value="sa">South Australia</SelectItem>
                      <SelectItem value="tas">Tasmania</SelectItem>
                      <SelectItem value="act">Australian Capital Territory</SelectItem>
                      <SelectItem value="nt">Northern Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">
                        <div>
                          <div className="font-medium">Standard Shipping</div>
                          <div className="text-sm text-gray-600">5-7 business days</div>
                        </div>
                      </Label>
                    </div>
                    <span className="font-medium">$15.00</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express">
                        <div>
                          <div className="font-medium">Express Shipping</div>
                          <div className="text-sm text-gray-600">2-3 business days</div>
                        </div>
                      </Label>
                    </div>
                    <span className="font-medium">$25.00</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit/Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="afterpay" id="afterpay" />
                    <Label htmlFor="afterpay">Afterpay</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400 text-xs text-center">No Image</div>';
                            }}
                          />
                        ) : (
                          <div className="text-gray-400 text-xs text-center">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">${item.price}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (10%)</span>
                    <span>${gst.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {paymentMethod === "card" && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCardPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Complete Order"}
                    </Button>
                  )}
                  
                  {paymentMethod === "paypal" && (
                    <div className="w-full">
                      {isFormValid ? (
                        <PayPalButton 
                          amount={finalTotal.toFixed(2)}
                          currency="AUD"
                          intent="capture"
                          orderData={{
                            customerData: formData,
                            cartItems,
                            shippingMethod,
                            paymentMethod: 'paypal',
                            totals: {
                              subtotal: cartTotal,
                              shipping: shippingCost,
                              tax: gst,
                              total: finalTotal
                            }
                          }}
                          onSuccess={handlePayPalSuccess}
                          onError={handlePayPalError}
                          onCancel={() => console.log('PayPal payment cancelled')}
                        />
                      ) : (
                        <div className="space-y-3">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm font-medium mb-2">
                              Please complete all required shipping information:
                            </p>
                            <ul className="text-yellow-700 text-xs space-y-1">
                              {!formData.firstName && <li>• First Name</li>}
                              {!formData.lastName && <li>• Last Name</li>}
                              {!formData.email && <li>• Email Address</li>}
                              {!formData.address && <li>• Street Address</li>}
                              {!formData.city && <li>• City</li>}
                              {!formData.postcode && <li>• Postcode</li>}
                              {!formData.state && <li>• State</li>}
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              // Focus on first empty required field
                              const firstEmpty = ['firstName', 'lastName', 'email', 'address', 'city', 'postcode'].find(
                                field => !formData[field as keyof typeof formData]
                              );
                              if (firstEmpty) {
                                document.getElementById(firstEmpty)?.focus();
                              }
                            }}
                            className="w-full bg-gray-300 text-gray-600 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                            disabled
                          >
                            Complete Required Fields to Continue
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "afterpay" && (
                    <Button 
                      className="w-full" 
                      size="lg" 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Afterpay Integration",
                          description: "Afterpay payment integration coming soon!",
                        });
                      }}
                    >
                      Pay with Afterpay
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-600 text-center">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
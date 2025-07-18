import { useState, useEffect } from "react";
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
import { ArrowLeft, Minus, Plus, Trash2, UserPlus, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import SimpleHeader from "@/components/storefront/simple-header";
import PayPalButton from "@/components/PayPalButton";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Checkout() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGuestCheckout, setIsGuestCheckout] = useState(!isAuthenticated);
  const [createAccount, setCreateAccount] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCosts, setShippingCosts] = useState<{
    postage: number;
    boxPrice: number;
    subtotal: number;
    gst: number;
    total: number;
    isOversized: boolean;
    oversizedMessage?: string;
  } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    state: '',
    password: '',
    confirmPassword: ''
  });

  // Prefill form data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Loading user data into form:', user);
      
      // Parse the address from the user profile
      let parsedCity = '';
      let parsedState = '';
      let parsedPostcode = '';
      let streetAddress = user.address || '';
      
      if (user.address) {
        // Handle addresses like "3 Conquest St, Mount Duneed VIC 3217, Australia"
        const addressParts = user.address.split(',');
        if (addressParts.length >= 3) {
          streetAddress = addressParts[0].trim();
          parsedCity = addressParts[1].trim();
          
          // Parse the state and postcode from the last part before country
          const statePostcodePart = addressParts[2].trim();
          const statePostcodeMatch = statePostcodePart.match(/^(.+?)\s+(\d{4})$/);
          if (statePostcodeMatch) {
            const stateFullName = statePostcodeMatch[1].trim();
            parsedPostcode = statePostcodeMatch[2];
            
            // Convert state name to code
            const stateMap: { [key: string]: string } = {
              'VIC': 'vic',
              'Victoria': 'vic',
              'NSW': 'nsw',
              'New South Wales': 'nsw',
              'QLD': 'qld',
              'Queensland': 'qld',
              'WA': 'wa',
              'Western Australia': 'wa',
              'SA': 'sa',
              'South Australia': 'sa',
              'TAS': 'tas',
              'Tasmania': 'tas',
              'ACT': 'act',
              'Australian Capital Territory': 'act',
              'NT': 'nt',
              'Northern Territory': 'nt'
            };
            
            parsedState = stateMap[stateFullName] || stateFullName.toLowerCase();
          }
        }
      }
      
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: streetAddress,
        city: parsedCity,
        postcode: parsedPostcode,
        state: parsedState.toLowerCase() // Convert to lowercase for state selector
      }));
      setIsGuestCheckout(false);
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  // Calculate shipping costs for all cart items
  const calculateShippingCosts = async (postcode: string) => {
    if (!postcode || cartItems.length === 0) return;
    
    setIsCalculatingShipping(true);
    try {
      // For each cart item, calculate shipping based on its dimensions and box size
      let totalShippingCost = 0;
      let hasOversizedItems = false;
      let oversizedMessage = '';
      
      for (const item of cartItems) {
        console.log('Processing cart item:', item);
        const response = await fetch(`/api/products/${item.productId}`);
        const product = await response.json();
        console.log('Product data:', product);
        
        // Check if product has free postage
        if (product.freePostage) {
          console.log('Product has free postage, skipping shipping calculation');
          // Product has free postage, continue to next item
          continue;
        }
        
        if (product.weight && product.length && product.width && product.height && product.boxSize) {
          console.log('Product has shipping dimensions, calculating cost...');
          const shippingResponse = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weight: product.weight,
              length: product.length,
              width: product.width,
              height: product.height,
              boxSize: product.boxSize,
              toPostcode: postcode
            })
          });
          
          const shippingData = await shippingResponse.json();
          console.log('Shipping calculation result:', shippingData);
          
          if (shippingData.isOversized) {
            hasOversizedItems = true;
            oversizedMessage = shippingData.oversizedMessage;
            break;
          } else {
            // Add to total shipping cost
            totalShippingCost += shippingData.total * item.quantity;
          }
        } else {
          console.log('Product missing shipping dimensions:', {
            weight: product.weight,
            length: product.length,
            width: product.width,
            height: product.height,
            boxSize: product.boxSize
          });
          // For products without shipping dimensions, use default small package
          console.log('Using default shipping dimensions for product without shipping info');
          const shippingResponse = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weight: 500, // 500g default
              length: 22,  // Bx1 dimensions
              width: 16,
              height: 7.7,
              boxSize: 'Bx1',
              toPostcode: postcode
            })
          });
          
          if (shippingResponse.ok) {
            const shippingData = await shippingResponse.json();
            console.log('Default shipping calculation result:', shippingData);
            totalShippingCost += shippingData.total * item.quantity;
          } else {
            console.error('Shipping calculation failed:', await shippingResponse.text());
          }
        }
      }
      
      if (hasOversizedItems) {
        setShippingCosts({
          postage: 0,
          boxPrice: 0,
          subtotal: 0,
          gst: 0,
          total: 0,
          isOversized: true,
          oversizedMessage
        });
      } else {
        // Calculate total GST and breakdown
        const subtotal = totalShippingCost / 1.1; // Remove GST to get subtotal
        const gst = totalShippingCost - subtotal;
        
        setShippingCosts({
          postage: subtotal * 0.7, // Approximate split between postage and box costs
          boxPrice: subtotal * 0.3,
          subtotal,
          gst,
          total: totalShippingCost,
          isOversized: false
        });
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast({
        title: "Shipping Calculation Error",
        description: "Unable to calculate shipping costs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingShipping(false);
    }
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
    
    // Calculate shipping costs when postcode is available
    if (postcode) {
      calculateShippingCosts(postcode);
    }
    
    console.log('Auto-populated address fields:', {
      address: streetAddress,
      city,
      state: state.toLowerCase(),
      postcode
    });
  };

  const validateForm = (showToast = false) => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postcode', 'state'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    
    // Additional validation for account creation
    if (isGuestCheckout && createAccount) {
      if (!formData.password) {
        missing.push('password');
      }
      if (!formData.confirmPassword) {
        missing.push('confirmPassword');
      }
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        if (showToast) {
          toast({
            title: "Password Mismatch",
            description: "Password and confirm password must match.",
            variant: "destructive"
          });
        }
        return false;
      }
    }
    
    if (missing.length > 0 && showToast) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including phone number for order follow-up.",
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
      // Create account if guest checkout with account creation
      if (isGuestCheckout && createAccount) {
        console.log('Creating new account...');
        try {
          // Format address properly for storage
          const stateCodeToName: { [key: string]: string } = {
            'vic': 'VIC',
            'nsw': 'NSW',
            'qld': 'QLD',
            'wa': 'WA',
            'sa': 'SA',
            'tas': 'TAS',
            'act': 'ACT',
            'nt': 'NT'
          };
          const stateCode = stateCodeToName[formData.state.toLowerCase()] || formData.state.toUpperCase();
          const fullAddress = `${formData.address}, ${formData.city}, ${stateCode} ${formData.postcode}, Australia`;
          
          const accountResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              address: fullAddress
            })
          });

          if (accountResponse.ok) {
            console.log('Account created successfully');
            toast({
              title: "Account Created",
              description: "Your account has been created and you've been logged in.",
            });
          } else {
            console.log('Account creation failed, continuing with guest checkout');
          }
        } catch (accountError) {
          console.error('Account creation error:', accountError);
          // Continue with guest checkout if account creation fails
        }
      }

      // Update existing user profile if authenticated
      if (isAuthenticated && user) {
        console.log('Updating user profile...');
        try {
          // Format address properly for storage
          const stateCodeToName: { [key: string]: string } = {
            'vic': 'VIC',
            'nsw': 'NSW',
            'qld': 'QLD',
            'wa': 'WA',
            'sa': 'SA',
            'tas': 'TAS',
            'act': 'ACT',
            'nt': 'NT'
          };
          const stateCode = stateCodeToName[formData.state.toLowerCase()] || formData.state.toUpperCase();
          const fullAddress = `${formData.address}, ${formData.city}, ${stateCode} ${formData.postcode}, Australia`;
          
          await fetch('/api/auth/update-profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              address: fullAddress
            })
          });
          console.log('Profile updated successfully');
        } catch (profileError) {
          console.error('Profile update error:', profileError);
          // Continue with order creation even if profile update fails
        }
      }

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

  // Calculate totals including dynamic Australia Post shipping
  const shippingCost = shippingCosts?.total || 0;
  const gst = cartTotal * 0.1; // GST on products (shipping GST already included in shippingCosts)
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
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="guest-checkout" 
                        checked={isGuestCheckout}
                        onCheckedChange={(checked) => setIsGuestCheckout(checked === true)}
                      />
                      <Label htmlFor="guest-checkout">Checkout as Guest</Label>
                    </div>
                    
                    {isGuestCheckout && (
                      <div className="ml-6 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="create-account" 
                            checked={createAccount}
                            onCheckedChange={(checked) => setCreateAccount(checked === true)}
                          />
                          <Label htmlFor="create-account" className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Create an account for future orders
                          </Label>
                        </div>
                        
                        {createAccount && (
                          <Alert>
                            <AlertDescription>
                              You'll be able to track orders, save addresses, and checkout faster next time!
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!isGuestCheckout && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" asChild>
                          <a href="/login">Sign In</a>
                        </Button>
                        <Button asChild>
                          <a href="/signup">Create Account</a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Logged In User Info */}
            {isAuthenticated && user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Logged in as <strong>{user.email}</strong>
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Your profile information has been automatically filled in below. You can update it if needed.
                    </p>
                  </div>
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
                
                {/* Password fields for account creation */}
                {isGuestCheckout && createAccount && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <Label className="text-sm font-medium text-blue-600">Account Setup</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Password *</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="Create password" 
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            placeholder="Confirm password" 
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                      onChange={(e) => {
                        const postcode = e.target.value;
                        handleInputChange('postcode', postcode);
                        // Calculate shipping when postcode is 4 digits
                        if (postcode.length === 4 && /^\d+$/.test(postcode)) {
                          calculateShippingCosts(postcode);
                        }
                      }}
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
                {isCalculatingShipping ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Calculating shipping costs...</p>
                    </div>
                  </div>
                ) : shippingCosts?.isOversized ? (
                  <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div>
                        <div className="font-medium text-orange-800">Custom Shipping Required</div>
                        <div className="text-sm text-orange-700 mt-1">
                          {shippingCosts.oversizedMessage}
                        </div>
                        <div className="text-sm font-medium text-orange-800 mt-2">
                          Please call: (03) 5221 8999
                        </div>
                      </div>
                    </div>
                  </div>
                ) : shippingCosts ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <Label>
                          <div>
                            <div className="font-medium">Australia Post Standard</div>
                            <div className="text-sm text-gray-600">5-7 business days</div>
                          </div>
                        </Label>
                      </div>
                      <span className="font-medium">${shippingCosts.total.toFixed(2)}</span>
                    </div>
                    
                    {/* Shipping breakdown */}
                    <div className="text-xs space-y-1 px-4 py-2 bg-gray-50 rounded border">
                      <div className="flex justify-between">
                        <span>Postage:</span>
                        <span>${shippingCosts.postage.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Box cost:</span>
                        <span>${shippingCosts.boxPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${shippingCosts.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (10%):</span>
                        <span>${shippingCosts.gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total shipping:</span>
                        <span>${shippingCosts.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : formData.postcode ? (
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Calculate Shipping</p>
                      <p className="mt-1">Complete your address to calculate accurate shipping costs using Australia Post rates.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Shipping Calculation</p>
                      <p className="mt-1">Enter your address to calculate shipping costs. We use Australia Post standard boxes with real-time pricing including GST.</p>
                    </div>
                  </div>
                )}
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
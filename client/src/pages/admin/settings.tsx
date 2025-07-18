import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Save, Store, Mail, Shield, Globe, Bell, Settings as SettingsIcon, Users, ShoppingCart, Lock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  variables: string[];
}

interface EmailSettings {
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  adminEmail: string;
  testEmail: string;
  templates: EmailTemplate[];
}

const defaultTemplates = [
  {
    id: "order_confirmation",
    name: "Order Confirmation",
    description: "Sent when a customer places an order",
    subject: "Order Confirmation - #{orderNumber}",
    htmlContent: `
      <h2>Thank you for your order!</h2>
      <p>Hi {customerName},</p>
      <p>We've received your order and it's being processed. Here are the details:</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <h3>Order #{orderNumber}</h3>
        <p><strong>Total:</strong> ${"{"}{total}{"}"}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Estimated Delivery:</strong> {estimatedDelivery}</p>
      </div>
      <p>We'll send you updates as your order progresses.</p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Thank you for your order!\n\nHi {customerName},\n\nWe've received your order #{orderNumber} and it's being processed.\n\nTotal: ${"{"}{total}{"}"}\nStatus: {status}\n\nWe'll send you updates as your order progresses.\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "orderNumber", "total", "status", "estimatedDelivery"]
  },
  {
    id: "order_status_update",
    name: "Order Status Update",
    description: "Sent when order status changes",
    subject: "Order Update - #{orderNumber}",
    htmlContent: `
      <h2>Order Status Update</h2>
      <p>Hi {customerName},</p>
      <p>Your order #{orderNumber} status has been updated:</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <p><strong>Previous Status:</strong> {previousStatus}</p>
        <p><strong>Current Status:</strong> {currentStatus}</p>
        {trackingNumber && <p><strong>Tracking Number:</strong> {trackingNumber}</p>}
      </div>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Order Status Update\n\nHi {customerName},\n\nYour order #{orderNumber} status has been updated:\n\nPrevious Status: {previousStatus}\nCurrent Status: {currentStatus}\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "orderNumber", "previousStatus", "currentStatus", "trackingNumber"]
  },
  {
    id: "cart_abandonment",
    name: "Cart Abandonment",
    description: "Sent to customers who left items in their cart",
    subject: "Don't forget your garage door quote!",
    htmlContent: `
      <h2>Complete Your Purchase</h2>
      <p>Hi {customerName},</p>
      <p>You left some items in your cart. Don't miss out on these great garage door solutions:</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <h3>Your Cart Items</h3>
        {cartItems}
        <p><strong>Total:</strong> ${"{"}{cartTotal}{"}"}</p>
      </div>
      <p><a href="{checkoutUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Purchase</a></p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Complete Your Purchase\n\nHi {customerName},\n\nYou left some items in your cart. Complete your purchase: {checkoutUrl}\n\nTotal: ${"{"}{cartTotal}{"}"}\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "cartItems", "cartTotal", "checkoutUrl"]
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "Sent when user requests password reset",
    subject: "Password Reset Request",
    htmlContent: `
      <h2>Password Reset Request</h2>
      <p>Hi {firstName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="{resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Password Reset Request\n\nHi {firstName},\n\nWe received a request to reset your password. Use this link: {resetUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["firstName", "resetUrl"]
  },
  {
    id: "staff_invitation",
    name: "Staff Invitation",
    description: "Sent when inviting new staff members",
    subject: "Welcome to Geelong Garage Doors Team",
    htmlContent: `
      <h2>Welcome to the Team!</h2>
      <p>Hi {firstName},</p>
      <p>You've been invited to join the Geelong Garage Doors team as a {role}.</p>
      <p>Click the link below to set up your account:</p>
      <p><a href="{setupUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Set Up Account</a></p>
      <p>This invitation will expire in 7 days.</p>
      <p>Best regards,<br>Admin Team</p>
    `,
    textContent: `Welcome to the Team!\n\nHi {firstName},\n\nYou've been invited to join as a {role}. Set up your account: {setupUrl}\n\nThis invitation expires in 7 days.\n\nBest regards,\nAdmin Team`,
    isActive: true,
    variables: ["firstName", "role", "setupUrl"]
  },
  {
    id: "low_stock_alert",
    name: "Low Stock Alert",
    description: "Sent to admin when product stock is low",
    subject: "Low Stock Alert - {productName}",
    htmlContent: `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <h3>{productName}</h3>
        <p><strong>SKU:</strong> {productSku}</p>
        <p><strong>Current Stock:</strong> {currentStock}</p>
        <p><strong>Minimum Threshold:</strong> {minThreshold}</p>
      </div>
      <p>Please restock this item soon to avoid stockouts.</p>
    `,
    textContent: `Low Stock Alert\n\nProduct: {productName}\nSKU: {productSku}\nCurrent Stock: {currentStock}\nMinimum Threshold: {minThreshold}\n\nPlease restock soon.`,
    isActive: true,
    variables: ["productName", "productSku", "currentStock", "minThreshold"]
  },
  {
    id: "quote_request",
    name: "Quote Request Confirmation",
    description: "Sent when customer submits quote request",
    subject: "Quote Request Received",
    htmlContent: `
      <h2>Quote Request Received</h2>
      <p>Hi {customerName},</p>
      <p>Thank you for your quote request. We've received your information and will get back to you within 24 hours.</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <h3>Your Request Details</h3>
        <p><strong>Project Type:</strong> {projectType}</p>
        <p><strong>Location:</strong> {location}</p>
        <p><strong>Message:</strong> {message}</p>
      </div>
      <p>Our team will review your requirements and provide a detailed quote.</p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Quote Request Received\n\nHi {customerName},\n\nThank you for your quote request. We'll get back to you within 24 hours.\n\nProject Type: {projectType}\nLocation: {location}\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "projectType", "location", "message"]
  },
  {
    id: "payment_confirmation",
    name: "Payment Confirmation",
    description: "Sent when payment is successfully processed",
    subject: "Payment Confirmed - Order #{orderNumber}",
    htmlContent: `
      <h2>Payment Confirmed</h2>
      <p>Hi {customerName},</p>
      <p>Your payment has been successfully processed for order #{orderNumber}.</p>
      <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> ${"{"}{amount}{"}"}</p>
        <p><strong>Payment Method:</strong> {paymentMethod}</p>
        <p><strong>Transaction ID:</strong> {transactionId}</p>
        <p><strong>Date:</strong> {paymentDate}</p>
      </div>
      <p>Your order is now being processed.</p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Payment Confirmed\n\nHi {customerName},\n\nPayment confirmed for order #{orderNumber}.\n\nAmount: ${"{"}{amount}{"}"}\nPayment Method: {paymentMethod}\nTransaction ID: {transactionId}\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "orderNumber", "amount", "paymentMethod", "transactionId", "paymentDate"]
  }
];

function EmailManagement() {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<any>(null);

  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/email-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-settings");
      if (!response.ok) {
        return {
          fromEmail: "orders@geelonggaragedoors.com.au",
          fromName: "Geelong Garage Doors",
          replyToEmail: "info@geelonggaragedoors.com.au",
          adminEmail: "admin@geelonggaragedoors.com.au",
          testEmail: "",
          templates: defaultTemplates
        };
      }
      return response.json();
    }
  });

  // Update local state when emailSettings changes
  useEffect(() => {
    if (emailSettings && !localSettings) {
      setLocalSettings(emailSettings);
    }
  }, [emailSettings, localSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<EmailSettings>) => {
      const response = await apiRequest("PUT", "/api/admin/email-settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
      toast({
        title: "Settings updated",
        description: "Email settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive",
      });
    },
  });



  const handleSettingsUpdate = (field: string, value: any) => {
    // Update local state immediately for responsive UI
    const updatedSettings = {
      ...localSettings,
      [field]: value
    };
    setLocalSettings(updatedSettings);
  };

  const saveSettings = () => {
    if (localSettings) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  // Template management has been moved to the dedicated Email Management section



  if (isLoading) {
    return <div className="p-6">Loading email settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure basic email settings and sender information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={localSettings?.fromEmail || ""}
                    onChange={(e) => handleSettingsUpdate("fromEmail", e.target.value)}
                    placeholder="orders@yourstore.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={localSettings?.fromName || ""}
                    onChange={(e) => handleSettingsUpdate("fromName", e.target.value)}
                    placeholder="Your Store Name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    value={localSettings?.replyToEmail || ""}
                    onChange={(e) => handleSettingsUpdate("replyToEmail", e.target.value)}
                    placeholder="support@yourstore.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    value={localSettings?.adminEmail || ""}
                    onChange={(e) => handleSettingsUpdate("adminEmail", e.target.value)}
                    placeholder="admin@yourstore.com"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Resend Integration</h4>
                <p className="text-sm text-blue-700">
                  This system uses Resend for reliable email delivery. Your RESEND_API_KEY is configured in environment variables.
                </p>
              </div>

              <Button 
                onClick={saveSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Email Configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Templates</span>
                </CardTitle>
                <CardDescription>
                  Select and configure email templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  Email template management is now available in the dedicated <strong>Email Management</strong> section. 
                  Go to Admin → Email Management to configure templates, test emails, and view analytics.
                </div>
              </CardContent>
            </Card>


          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json()),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settingsData: any) => fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const storeForm = useForm({
    defaultValues: {
      storeName: "Geelong Garage Doors",
      storeDescription: "Professional garage door solutions across Geelong and surrounding areas",
      contactEmail: "info@geelonggaragedoors.com.au",
      contactPhone: "(03) 5221 8999",
      address: "Geelong, VIC 3220",
      website: "https://geelonggaragedoors.com.au",
    },
  });

  const emailForm = useForm({
    defaultValues: {
      fromEmail: "orders@geelonggaragedoors.com.au",
      adminEmail: "info@geelonggaragedoors.com.au",
      enableOrderConfirmations: true,
      enableStatusUpdates: true,
      enableAdminNotifications: true,
      enableLowStockAlerts: true,
    },
  });

  const shippingForm = useForm({
    defaultValues: {
      defaultShippingRate: "25.00",
      freeShippingThreshold: "500.00",
      australiaPostApiKey: "",
      enableAustraliaPost: false,
      localDeliveryRadius: "50",
      localDeliveryRate: "15.00",
    },
  });

  const notificationForm = useForm({
    defaultValues: {
      orderNotifications: true,
      lowStockNotifications: true,
      customerSignupNotifications: true,
      emailHost: "smtp.gmail.com",
      emailPort: "587",
      emailUsername: "",
      emailPassword: "",
    },
  });

  const securityForm = useForm({
    defaultValues: {
      requireStrongPasswords: true,
      sessionTimeout: "24",
      twoFactorAuth: false,
      backupFrequency: "daily",
    },
  });

  const onStoreSubmit = (data: any) => {
    updateSettingsMutation.mutate({ section: 'store', data });
  };

  const onShippingSubmit = (data: any) => {
    updateSettingsMutation.mutate({ section: 'shipping', data });
  };

  const onEmailSubmit = (data: any) => {
    updateSettingsMutation.mutate({ section: 'email', data });
  };

  const onNotificationSubmit = (data: any) => {
    updateSettingsMutation.mutate({ section: 'notifications', data });
  };

  const onSecuritySubmit = (data: any) => {
    updateSettingsMutation.mutate({ section: 'security', data });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-gray-600">Configure store settings and preferences</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store" className="flex items-center space-x-2">
            <Store className="w-4 h-4" />
            <span>Store</span>
          </TabsTrigger>

          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="w-5 h-5" />
                <span>Store Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...storeForm}>
                <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={storeForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={storeForm.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={storeForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={storeForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Store Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="email">
          <EmailManagement />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Types</h4>
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="orderNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>New Order Notifications</FormLabel>
                              <FormDescription>
                                Send email notifications when new orders are placed
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="lowStockNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Low Stock Alerts</FormLabel>
                              <FormDescription>
                                Alert when product inventory falls below threshold
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="customerSignupNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Customer Signup Notifications</FormLabel>
                              <FormDescription>
                                Notify when new customers register
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Resend Email Service</h4>
                    <p className="text-sm text-green-700">
                      Email notifications are powered by Resend for reliable delivery. 
                      The system automatically handles all three notification types when enabled:
                    </p>
                    <ul className="text-sm text-green-700 mt-2 ml-4 list-disc">
                      <li>Order confirmations and status updates</li>
                      <li>Low stock alerts when inventory is low</li>
                      <li>Customer registration notifications</li>
                    </ul>
                  </div>

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="requireStrongPasswords"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Require Strong Passwords</FormLabel>
                            <p className="text-sm text-gray-600">Enforce password complexity requirements</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Two-Factor Authentication</FormLabel>
                            <p className="text-sm text-gray-600">Enable 2FA for admin accounts</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (hours)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backup Frequency</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="daily, weekly, monthly" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
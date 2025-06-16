import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Send, TestTube, Settings, Users, ShoppingCart, Lock, Package, AlertCircle, CheckCircle } from "lucide-react";

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
        <p><strong>Total:</strong> ${"{total}"}</p>
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
        <p><strong>Total:</strong> ${"{cartTotal}"}</p>
      </div>
      <p><a href="{checkoutUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Purchase</a></p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Complete Your Purchase\n\nHi {customerName},\n\nYou left some items in your cart. Complete your purchase: {checkoutUrl}\n\nTotal: ${"{cartTotal}"}\n\nBest regards,\nGeelong Garage Doors Team`,
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
        <p><strong>Amount:</strong> ${"{amount}"}</p>
        <p><strong>Payment Method:</strong> {paymentMethod}</p>
        <p><strong>Transaction ID:</strong> {transactionId}</p>
        <p><strong>Date:</strong> {paymentDate}</p>
      </div>
      <p>Your order is now being processed.</p>
      <p>Best regards,<br>Geelong Garage Doors Team</p>
    `,
    textContent: `Payment Confirmed\n\nHi {customerName},\n\nPayment confirmed for order #{orderNumber}.\n\nAmount: ${"{amount}"}\nPayment Method: {paymentMethod}\nTransaction ID: {transactionId}\n\nBest regards,\nGeelong Garage Doors Team`,
    isActive: true,
    variables: ["customerName", "orderNumber", "amount", "paymentMethod", "transactionId", "paymentDate"]
  }
];

export default function EmailSettings() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("order_confirmation");
  const [testEmail, setTestEmail] = useState("");

  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/email-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-settings");
      if (!response.ok) {
        // Return default settings if not found
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

  const testEmailMutation = useMutation({
    mutationFn: async (data: { templateId: string; email: string }) => {
      const response = await apiRequest("POST", "/api/admin/email-test", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox for the test email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const handleSettingsUpdate = (field: string, value: any) => {
    const updatedSettings = {
      ...emailSettings,
      [field]: value
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleTemplateUpdate = (templateId: string, updates: Partial<EmailTemplate>) => {
    const updatedTemplates = emailSettings.templates.map((template: EmailTemplate) =>
      template.id === templateId ? { ...template, ...updates } : template
    );
    updateSettingsMutation.mutate({ templates: updatedTemplates });
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate({ templateId: selectedTemplate, email: testEmail });
  };

  const selectedTemplateData = emailSettings?.templates.find((t: EmailTemplate) => t.id === selectedTemplate);

  if (isLoading) {
    return <div className="p-6">Loading email settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Email Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="test">Test Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure your email settings for sending notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings?.fromEmail || ""}
                    onChange={(e) => handleSettingsUpdate("fromEmail", e.target.value)}
                    placeholder="orders@geelonggaragedoors.com.au"
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings?.fromName || ""}
                    onChange={(e) => handleSettingsUpdate("fromName", e.target.value)}
                    placeholder="Geelong Garage Doors"
                  />
                </div>
                <div>
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    value={emailSettings?.replyToEmail || ""}
                    onChange={(e) => handleSettingsUpdate("replyToEmail", e.target.value)}
                    placeholder="info@geelonggaragedoors.com.au"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    value={emailSettings?.adminEmail || ""}
                    onChange={(e) => handleSettingsUpdate("adminEmail", e.target.value)}
                    placeholder="admin@geelonggaragedoors.com.au"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Select a template to customize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailSettings?.templates.map((template: EmailTemplate) => (
                    <div
                      key={template.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              {selectedTemplateData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedTemplateData.name}
                      <div className="flex items-center gap-2">
                        <Label htmlFor="templateActive">Active</Label>
                        <Switch
                          id="templateActive"
                          checked={selectedTemplateData.isActive}
                          onCheckedChange={(checked) =>
                            handleTemplateUpdate(selectedTemplate, { isActive: checked })
                          }
                        />
                      </div>
                    </CardTitle>
                    <CardDescription>{selectedTemplateData.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={selectedTemplateData.subject}
                        onChange={(e) =>
                          handleTemplateUpdate(selectedTemplate, { subject: e.target.value })
                        }
                        placeholder="Email subject"
                      />
                    </div>

                    <div>
                      <Label htmlFor="htmlContent">HTML Content</Label>
                      <Textarea
                        id="htmlContent"
                        value={selectedTemplateData.htmlContent}
                        onChange={(e) =>
                          handleTemplateUpdate(selectedTemplate, { htmlContent: e.target.value })
                        }
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="textContent">Plain Text Content</Label>
                      <Textarea
                        id="textContent"
                        value={selectedTemplateData.textContent}
                        onChange={(e) =>
                          handleTemplateUpdate(selectedTemplate, { textContent: e.target.value })
                        }
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label>Available Variables</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplateData.variables.map((variable: string) => (
                          <Badge key={variable} variant="outline">
                            {"{" + variable + "}"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Email Templates
              </CardTitle>
              <CardDescription>
                Send test emails to verify your templates are working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testEmailAddress">Test Email Address</Label>
                  <Input
                    id="testEmailAddress"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="templateSelect">Template to Test</Label>
                  <select
                    id="templateSelect"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {emailSettings?.templates.map((template: EmailTemplate) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !testEmail}
                className="w-full md:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
              </Button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Test Email Information</h4>
                <p className="text-sm text-gray-600">
                  Test emails will be sent with sample data to verify formatting and content.
                  The email will be sent using your configured Resend API key.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
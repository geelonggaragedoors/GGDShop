import { useState } from "react";
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
import { Save, Store, Mail, Shield, Globe, Bell, Send, TestTube, Settings as SettingsIcon, Users, ShoppingCart, Lock, Package, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Save, Store, Mail, Shield, Globe, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure email settings for order confirmations and notifications using Resend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={emailForm.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="orders@yourstore.com" />
                            </FormControl>
                            <FormDescription>
                              Email address used for sending order confirmations
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="admin@yourstore.com" />
                            </FormControl>
                            <FormDescription>
                              Email address for receiving admin notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Email Notifications</h4>
                      <div className="space-y-3">
                        <FormField
                          control={emailForm.control}
                          name="enableOrderConfirmations"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Order Confirmations</FormLabel>
                                <FormDescription>
                                  Send confirmation emails to customers when orders are placed
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={emailForm.control}
                          name="enableStatusUpdates"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Status Updates</FormLabel>
                                <FormDescription>
                                  Send emails when order status changes
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={emailForm.control}
                          name="enableAdminNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Admin Notifications</FormLabel>
                                <FormDescription>
                                  Send emails to admin when new orders are received
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={emailForm.control}
                          name="enableLowStockAlerts"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Low Stock Alerts</FormLabel>
                                <FormDescription>
                                  Send emails when product stock is running low
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

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Resend Integration</h4>
                      <p className="text-sm text-blue-700">
                        This system uses Resend for reliable email delivery. Your RESEND_API_KEY is configured in the environment variables.
                        All emails are sent through Resend's transactional email service for optimal deliverability.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
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
                    <h4 className="font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      <FormField
                        control={notificationForm.control}
                        name="orderNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>New Order Notifications</FormLabel>
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
                            <FormLabel>Low Stock Alerts</FormLabel>
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
                            <FormLabel>Customer Signup Notifications</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">SMTP Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="emailPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={notificationForm.control}
                        name="emailUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="emailPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
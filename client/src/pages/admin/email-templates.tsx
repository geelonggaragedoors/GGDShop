import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Plus, Edit3, Trash2, Eye, Send, Copy, FileText, Users, Shield, Zap } from "lucide-react";
import type { EmailTemplate } from "@shared/schema";

const templateTypes = [
  { value: "customer", label: "Customer", icon: Users, color: "bg-blue-500" },
  { value: "staff", label: "Staff", icon: FileText, color: "bg-green-500" },
  { value: "admin", label: "Admin", icon: Shield, color: "bg-purple-500" },
];

const categories = {
  customer: [
    { value: "order_confirmation", label: "Order Confirmation" },
    { value: "shipping_notification", label: "Shipping Notification" },
    { value: "delivery_confirmation", label: "Delivery Confirmation" },
    { value: "welcome", label: "Welcome Email" },
    { value: "password_reset", label: "Password Reset" },
    { value: "account_verification", label: "Account Verification" },
  ],
  staff: [
    { value: "order_notification", label: "Order Notification" },
    { value: "low_stock_alert", label: "Low Stock Alert" },
    { value: "new_enquiry", label: "New Enquiry" },
    { value: "system_alert", label: "System Alert" },
  ],
  admin: [
    { value: "daily_report", label: "Daily Report" },
    { value: "system_error", label: "System Error" },
    { value: "security_alert", label: "Security Alert" },
    { value: "backup_report", label: "Backup Report" },
  ],
};

const templateVariables = {
  customer: [
    { name: "customer_name", description: "Customer full name" },
    { name: "customer_email", description: "Customer email address" },
    { name: "order_number", description: "Order number" },
    { name: "order_total", description: "Order total amount" },
    { name: "order_date", description: "Order date" },
    { name: "order_status", description: "Current order status" },
    { name: "tracking_number", description: "Shipping tracking number" },
    { name: "delivery_address", description: "Delivery address" },
    { name: "company_name", description: "Geelong Garage Doors" },
    { name: "company_phone", description: "Company phone number" },
    { name: "company_email", description: "Company email address" },
    { name: "company_website", description: "Company website URL" },
  ],
  staff: [
    { name: "staff_name", description: "Staff member name" },
    { name: "customer_name", description: "Customer full name" },
    { name: "customer_email", description: "Customer email address" },
    { name: "customer_phone", description: "Customer phone number" },
    { name: "order_number", description: "Order number" },
    { name: "order_total", description: "Order total amount" },
    { name: "order_date", description: "Order date" },
    { name: "order_items", description: "List of ordered items" },
    { name: "priority", description: "Priority level (High, Medium, Low)" },
    { name: "notification_type", description: "Type of notification" },
  ],
  admin: [
    { name: "admin_name", description: "Admin name" },
    { name: "system_alert", description: "System alert message" },
    { name: "user_count", description: "Total user count" },
    { name: "order_count", description: "Total order count" },
    { name: "revenue_today", description: "Today revenue" },
    { name: "revenue_month", description: "Monthly revenue" },
    { name: "low_stock_items", description: "Items with low stock" },
    { name: "pending_orders", description: "Number of pending orders" },
    { name: "error_message", description: "System error message" },
    { name: "timestamp", description: "Current timestamp" },
  ],
};

export default function EmailTemplates() {
  const [selectedType, setSelectedType] = useState<string>("customer");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    templateType: "customer",
    category: "",
    isActive: true,
  });

  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["/api/admin/email-templates", selectedType],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/email-templates?templateType=${selectedType}`);
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      const response = await apiRequest("POST", "/api/admin/email-templates", template);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Template created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: any) => {
      const response = await apiRequest("PUT", `/api/admin/email-templates/${id}`, template);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Template updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Template deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async ({ templateId, email }: { templateId: string; email: string }) => {
      const response = await apiRequest("POST", `/api/admin/email-templates/${templateId}/test`, { email });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Test email sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      htmlContent: "",
      textContent: "",
      templateType: "customer",
      category: "",
      isActive: true,
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      templateType: template.templateType,
      category: template.category,
      isActive: template.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, ...formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable}}}` + after;
      setFormData({ ...formData, htmlContent: newText });
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const sendTestEmail = (templateId: string) => {
    const email = prompt("Enter email address for test:");
    if (email) {
      testEmailMutation.mutate({ templateId, email });
    }
  };

  const selectedTypeData = templateTypes.find(type => type.value === selectedType);
  const templates = templatesData?.templates || [];
  const availableCategories = categories[selectedType as keyof typeof categories] || [];
  const availableVariables = templateVariables[selectedType as keyof typeof templateVariables] || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">Manage email templates for customers, staff, and admin notifications</p>
        </div>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select
                    value={formData.templateType}
                    onValueChange={(value) => setFormData({ ...formData, templateType: value, category: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories[formData.templateType as keyof typeof categories]?.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Enter your email template content here..."
                    required
                  />
                </div>
                <div>
                  <Label>Available Variables</Label>
                  <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto border rounded p-3">
                    {availableVariables.map((variable) => (
                      <div key={variable.name} className="text-sm">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-1 px-2"
                          onClick={() => insertVariable(variable.name)}
                        >
                          <div>
                            <div className="font-mono text-blue-600">{variable.name}</div>
                            <div className="text-xs text-gray-500">{variable.description}</div>
                          </div>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active Template</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                  {createTemplateMutation.isPending || updateTemplateMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {templateTypes.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <Icon className="h-4 w-4" />
                {type.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {templateTypes.map((type) => (
          <TabsContent key={type.value} value={type.value} className="mt-6">
            <div className="grid gap-6">
              {isLoading ? (
                <div className="text-center py-8">Loading templates...</div>
              ) : templates.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-600 mb-4">Create your first {type.label.toLowerCase()} email template</p>
                    <Button onClick={() => {
                      setFormData({ ...formData, templateType: type.value });
                      setIsEditModalOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template: EmailTemplate) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${selectedTypeData?.color}`} />
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription>{template.subject}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Created: {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendTestEmail(template.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Test
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
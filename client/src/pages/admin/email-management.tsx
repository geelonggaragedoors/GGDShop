import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Send, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Loader2
} from "lucide-react";

interface EmailLog {
  id: string;
  templateId: string | null;
  templateName: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  status: string;
  resendId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

function TestEmailForm({ templates }: { templates: any[] }) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("order_confirmation");
  const [testEmail, setTestEmail] = useState("");

  const testEmailMutation = useMutation({
    mutationFn: async ({ templateId, email }: { templateId: string; email: string }) => {
      const response = await apiRequest("POST", "/api/admin/email-test", {
        templateId,
        testEmail: email,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test email sent successfully",
        description: `Test email has been sent to ${testEmail}`,
      });
      // Refresh email logs to show the test email
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test email",
        description: error.message || "There was an error sending the test email",
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with:', { testEmail, selectedTemplate });
    
    if (!testEmail || testEmail.trim() === '') {
      toast({
        title: "Email required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTemplate) {
      toast({
        title: "Template required",
        description: "Please select a template to test",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate({ templateId: selectedTemplate, email: testEmail });
  };

  return (
    <form onSubmit={handleTestEmail} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="template">Template to Test</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((template: any) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="testEmail">Test Email Address</Label>
          <Input
            id="testEmail"
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={testEmailMutation.isPending}>
          {testEmailMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>
        
        {selectedTemplate && (
          <div className="text-sm text-gray-600">
            Selected: {templates?.find(t => t.id === selectedTemplate)?.name}
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Test Email Info</h4>
        <p className="text-sm text-blue-700">
          Test emails will be sent using sample data and will be tracked in your email logs. 
          The email will be clearly marked as "[TEST]" in the subject line.
        </p>
      </div>
    </form>
  );
}

export default function EmailManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [page, setPage] = useState(0);
  const limit = 50;

  // Fetch email logs
  const { data: emailLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/admin/email-logs", { 
      limit, 
      offset: page * limit, 
      status: statusFilter === "all" ? undefined : statusFilter,
      templateId: templateFilter === "all" ? undefined : templateFilter,
      recipientEmail: searchTerm || undefined,
      startDate: dateRange === "all" ? undefined : new Date(Date.now() - getDaysInMs(dateRange)).toISOString(),
      endDate: new Date().toISOString(),
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (templateFilter !== "all") params.append("templateId", templateFilter);
      if (searchTerm) params.append("recipientEmail", searchTerm);
      if (dateRange !== "all") {
        params.append("startDate", new Date(Date.now() - getDaysInMs(dateRange)).toISOString());
        params.append("endDate", new Date().toISOString());
      }
      
      const response = await fetch(`/api/admin/email-logs?${params}`);
      return response.json();
    },
  });

  // Fetch email analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/email-analytics", { 
      templateId: templateFilter === "all" ? undefined : templateFilter,
      startDate: dateRange === "all" ? undefined : new Date(Date.now() - getDaysInMs(dateRange)).toISOString(),
      endDate: new Date().toISOString(),
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        endDate: new Date().toISOString(),
      });
      
      if (templateFilter !== "all") params.append("templateId", templateFilter);
      if (dateRange !== "all") {
        params.append("startDate", new Date(Date.now() - getDaysInMs(dateRange)).toISOString());
      }
      
      const response = await fetch(`/api/admin/email-analytics?${params}`);
      return response.json();
    },
  });

  // Fetch email templates for filtering
  const { data: templates } = useQuery({
    queryKey: ["/api/admin/email-templates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-templates");
      return response.json();
    },
  });

  function getDaysInMs(range: string): number {
    const days = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "all": 0
    };
    return (days[range as keyof typeof days] || 7) * 24 * 60 * 60 * 1000;
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      sent: { color: "bg-blue-100 text-blue-800", icon: Send },
      delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      bounced: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} capitalize`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    refetchLogs();
  };

  const handleFilterChange = () => {
    setPage(0);
    refetchLogs();
  };

  const exportLogs = () => {
    // TODO: Implement CSV export
    toast({
      title: "Export feature coming soon",
      description: "CSV export functionality will be available soon.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Email Management</h1>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleFilterChange} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  </div>
                  <p className="text-2xl font-bold">{analytics?.totalSent || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                  </div>
                  <p className="text-2xl font-bold">{analytics?.totalDelivered || 0}</p>
                  <p className="text-sm text-gray-500">
                    {analytics?.deliveryRate?.toFixed(1) || 0}% delivery rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-gray-600">Opened</p>
                  </div>
                  <p className="text-2xl font-bold">{analytics?.totalOpened || 0}</p>
                  <p className="text-sm text-gray-500">
                    {analytics?.openRate?.toFixed(1) || 0}% open rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                  </div>
                  <p className="text-2xl font-bold">{analytics?.totalFailed || 0}</p>
                  <p className="text-sm text-gray-500">
                    {analytics?.totalSent > 0 ? ((analytics?.totalFailed || 0) / analytics.totalSent * 100).toFixed(1) : 0}% failure rate
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Email Performance Overview
              </CardTitle>
              <CardDescription>
                Track your email delivery and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Delivery Rate</span>
                  <span className="text-sm font-bold">{analytics?.deliveryRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.deliveryRate || 0}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Open Rate</span>
                  <span className="text-sm font-bold">{analytics?.openRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.openRate || 0}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Click Rate</span>
                  <span className="text-sm font-bold">{analytics?.clickRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.clickRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by recipient email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
              <CardDescription>
                View all sent emails and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {emailLogs?.logs?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No email logs found for the selected criteria.
                    </div>
                  ) : (
                    <>
                      {emailLogs?.logs?.map((log: EmailLog) => (
                        <div key={log.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-medium">{log.subject}</h4>
                                <p className="text-sm text-gray-600">
                                  To: {log.recipientEmail}
                                  {log.recipientName && ` (${log.recipientName})`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(log.status)}
                              <span className="text-sm text-gray-500">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          {log.templateName && (
                            <div className="text-sm text-gray-600">
                              Template: <span className="font-medium">{log.templateName}</span>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Sent:</span>
                              <div className="font-medium">{formatDate(log.sentAt)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Delivered:</span>
                              <div className="font-medium">{formatDate(log.deliveredAt)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Opened:</span>
                              <div className="font-medium">{formatDate(log.openedAt)}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Clicked:</span>
                              <div className="font-medium">{formatDate(log.clickedAt)}</div>
                            </div>
                          </div>
                          
                          {log.errorMessage && (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-sm text-red-800">
                                <strong>Error:</strong> {log.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-gray-600">
                          Showing {page * limit + 1} to {Math.min((page + 1) * limit, emailLogs?.total || 0)} of {emailLogs?.total || 0} logs
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!emailLogs?.logs || emailLogs.logs.length < limit}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Email</CardTitle>
              <CardDescription>
                Send test emails to verify your email templates and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestEmailForm templates={templates} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Available email templates for your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates?.map((template: any) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Template ID: {template.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resend Configuration</CardTitle>
              <CardDescription>
                Your email system is powered by Resend for reliable delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">✅ Resend Connected</h4>
                  <p className="text-sm text-green-700">
                    Your RESEND_API_KEY is configured and ready to send emails. 
                    All emails are automatically logged and tracked in this system.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Email Tracking Features</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Delivery confirmation tracking</li>
                    <li>• Open rate monitoring</li>
                    <li>• Click tracking</li>
                    <li>• Bounce and failure detection</li>
                    <li>• Comprehensive email analytics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
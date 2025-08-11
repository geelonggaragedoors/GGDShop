import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Mail, Phone, Send, Loader2, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
    attachment: null as File | null
  });
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    queryFn: api.admin.customers.getAll,
  });

  const filteredCustomers = Array.isArray(customers) ? customers.filter((customer: any) =>
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const columns = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.original.firstName && row.original.lastName 
              ? `${row.original.firstName} ${row.original.lastName}`
              : row.original.email
            }
          </p>
          <p className="text-sm text-gray-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: "contact",
      cell: ({ row }: any) => (
        <div>
          {row.original.phone && (
            <p className="text-sm text-gray-600 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {row.original.phone}
            </p>
          )}
          {row.original.company && (
            <p className="text-sm text-gray-500">{row.original.company}</p>
          )}
        </div>
      ),
    },
    {
      header: "Orders",
      accessorKey: "orders",
      cell: ({ row }: any) => (
        <div className="text-center">
          <p className="font-medium text-gray-900">{row.original.orderCount || 0}</p>
          <p className="text-sm text-gray-500">
            ${parseFloat(row.original.totalSpent || '0').toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: ({ row }: any) => (
        <span className="text-gray-600">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedCustomer(row.original)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {selectedCustomer.firstName && selectedCustomer.lastName
                            ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                            : 'Not provided'
                          }
                        </p>
                        <p className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {selectedCustomer.email}
                        </p>
                        {selectedCustomer.phone && (
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {selectedCustomer.phone}
                          </p>
                        )}
                        {selectedCustomer.company && (
                          <p>
                            <span className="font-medium">Company:</span> {selectedCustomer.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Account Details</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Joined:</span>{' '}
                          {format(new Date(selectedCustomer.createdAt), 'MMMM dd, yyyy')}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          <Badge variant={selectedCustomer.isActive ? "default" : "secondary"}>
                            {selectedCustomer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                        <p>
                          <span className="font-medium">Orders:</span> {selectedCustomer.orderCount || 0}
                        </p>
                        <p>
                          <span className="font-medium">Total Spent:</span> ${parseFloat(selectedCustomer.totalSpent || '0').toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedCustomer(row.original)}
              >
                <Mail className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Email Customer</DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Sending to: <span className="font-medium">{selectedCustomer.email}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="attachment">Attachment (optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="attachment"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setEmailForm(prev => ({ 
                          ...prev, 
                          attachment: e.target.files?.[0] || null 
                        }))}
                        className="flex-1"
                      />
                      {emailForm.attachment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmailForm(prev => ({ ...prev, attachment: null }))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {emailForm.attachment && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Paperclip className="w-3 h-3 mr-1" />
                        {emailForm.attachment.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEmailDialogOpen(false)}
                      disabled={sendEmailMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendEmailMutation.isPending || !emailForm.subject || !emailForm.message}
                    >
                      {sendEmailMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ];

  // Email customer mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ customer, subject, message, attachment }: { 
      customer: any; 
      subject: string; 
      message: string; 
      attachment: File | null;
    }) => {
      const formData = new FormData();
      formData.append('to', customer.email);
      formData.append('subject', subject);
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }
      
      const response = await fetch('/api/admin/send-customer-email', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      setEmailDialogOpen(false);
      setEmailForm({ subject: "", message: "", attachment: null });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!selectedCustomer || !emailForm.subject || !emailForm.message) {
      toast({
        title: "Missing information",
        description: "Please fill in subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      customer: selectedCustomer,
      subject: emailForm.subject,
      message: emailForm.message,
      attachment: emailForm.attachment,
    });
  };

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customers Management</h2>
              <p className="text-gray-600">Customer relationship management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search customers by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
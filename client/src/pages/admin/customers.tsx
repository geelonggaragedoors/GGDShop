import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Mail, Phone, Send, Loader2, Paperclip, Plus, FileText, History, Trash2, Edit } from "lucide-react";
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
  const [noteForm, setNoteForm] = useState({
    subject: "",
    message: "",
    noteType: "general",
    isPrivate: false,
    attachment: null as File | null
  });
  const [editingNote, setEditingNote] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/admin/customers"],
    queryFn: api.admin.customers.getAll,
  });

  // Customer notes query
  const { data: customerNotes, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      const response = await apiRequest("GET", `/api/admin/customers/${selectedCustomer.id}/notes`);
      return response.json();
    },
    enabled: !!selectedCustomer?.id,
  });

  // Email history query (from email logs)
  const { data: emailHistory, isLoading: emailHistoryLoading } = useQuery({
    queryKey: ["/api/admin/email-logs", selectedCustomer?.email],
    queryFn: async () => {
      if (!selectedCustomer?.email) return { logs: [], total: 0 };
      const response = await apiRequest("GET", `/api/admin/email-logs?recipientEmail=${selectedCustomer.email}&limit=50`);
      return response.json();
    },
    enabled: !!selectedCustomer?.email,
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
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
              </DialogHeader>
              {selectedCustomer && (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="notes">
                      Notes ({Array.isArray(customerNotes) ? customerNotes.length : 0})
                    </TabsTrigger>
                    <TabsTrigger value="emails">
                      Email History ({emailHistory?.total || 0})
                    </TabsTrigger>
                    <TabsTrigger value="add-note">Add Note</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
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
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {notesLoading ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
                        </div>
                      ) : Array.isArray(customerNotes) && customerNotes.length > 0 ? (
                        customerNotes.map((note: any) => (
                          <Card key={note.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{note.subject}</h4>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')} by {note.createdByName}
                                  {note.isPrivate && <Badge variant="secondary" className="ml-2">Private</Badge>}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingNote(note)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNoteMutation.mutate(note.id)}
                                  disabled={deleteNoteMutation.isPending}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.message}</p>
                            {note.attachmentUrl && (
                              <div className="mt-2">
                                <a 
                                  href={note.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                >
                                  <Paperclip className="w-3 h-3 mr-1" />
                                  View Attachment
                                </a>
                              </div>
                            )}
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notes found for this customer</p>
                          <p className="text-sm">Add a note to keep track of interactions</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="emails" className="mt-4 max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {emailHistoryLoading ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="text-sm text-gray-500 mt-2">Loading email history...</p>
                        </div>
                      ) : Array.isArray(emailHistory?.logs) && emailHistory.logs.length > 0 ? (
                        emailHistory.logs.map((email: any) => (
                          <Card key={email.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{email.subject}</h4>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(email.sentAt), 'MMM dd, yyyy HH:mm')}
                                  <Badge variant={email.status === 'sent' ? 'default' : 'destructive'} className="ml-2">
                                    {email.status}
                                  </Badge>
                                </p>
                              </div>
                              <Badge variant="outline">{email.templateType || 'custom'}</Badge>
                            </div>
                            {email.errorMessage && (
                              <p className="text-xs text-red-600 mb-2">{email.errorMessage}</p>
                            )}
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No email history found</p>
                          <p className="text-sm">Emails sent to this customer will appear here</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="add-note" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="note-subject">Subject</Label>
                        <Input
                          id="note-subject"
                          value={noteForm.subject}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Enter note subject..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note-message">Message</Label>
                        <Textarea
                          id="note-message"
                          value={noteForm.message}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter your note..."
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="note-type">Note Type</Label>
                          <select
                            id="note-type"
                            value={noteForm.noteType}
                            onChange={(e) => setNoteForm(prev => ({ ...prev, noteType: e.target.value }))}
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            <option value="general">General</option>
                            <option value="support">Support</option>
                            <option value="sales">Sales</option>
                            <option value="complaint">Complaint</option>
                            <option value="follow-up">Follow-up</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <input
                            type="checkbox"
                            id="note-private"
                            checked={noteForm.isPrivate}
                            onChange={(e) => setNoteForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                          />
                          <Label htmlFor="note-private" className="text-sm">Private Note</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note-attachment">Attachment (Optional)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="note-attachment"
                            type="file"
                            onChange={(e) => setNoteForm(prev => ({ 
                              ...prev, 
                              attachment: e.target.files?.[0] || null 
                            }))}
                            className="flex-1"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                          />
                          {noteForm.attachment && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setNoteForm(prev => ({ ...prev, attachment: null }))}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        {noteForm.attachment && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {noteForm.attachment.name}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setNoteForm({ subject: "", message: "", noteType: "general", isPrivate: false, attachment: null })}
                          disabled={createNoteMutation.isPending}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={() => createNoteMutation.mutate(noteForm)}
                          disabled={createNoteMutation.isPending || !noteForm.subject || !noteForm.message}
                        >
                          {createNoteMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Note
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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

  // Customer notes mutations
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const formData = new FormData();
      formData.append('subject', noteData.subject);
      formData.append('message', noteData.message);
      formData.append('noteType', noteData.noteType);
      formData.append('isPrivate', noteData.isPrivate.toString());
      if (noteData.attachment) {
        formData.append('attachment', noteData.attachment);
      }
      
      const response = await fetch(`/api/admin/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note created",
        description: "Customer note has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
      setNoteForm({ subject: "", message: "", noteType: "general", isPrivate: false, attachment: null });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, noteData }: { noteId: string; noteData: any }) => {
      const response = await apiRequest("PUT", `/api/admin/customers/${selectedCustomer.id}/notes/${noteId}`, noteData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note updated",
        description: "Customer note has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
      setEditingNote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/customers/${selectedCustomer.id}/notes/${noteId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "Customer note has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
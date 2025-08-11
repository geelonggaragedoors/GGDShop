import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Trash2,
  Filter
} from "lucide-react";
import { format } from "date-fns";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminEnquiries() {
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ["/api/enquiries", { status: statusFilter !== "all" ? statusFilter : undefined, priority: priorityFilter !== "all" ? priorityFilter : undefined }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/enquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] });
      toast({
        title: "Status Updated",
        description: "Enquiry status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update enquiry status.",
        variant: "destructive",
      });
    },
  });

  const deleteEnquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/enquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] });
      toast({
        title: "Enquiry Deleted",
        description: "Enquiry has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete enquiry.",
        variant: "destructive",
      });
    },
  });

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800", 
      high: "bg-red-100 text-red-800"
    };
    return variants[priority as keyof typeof variants] || variants.medium;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "new":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const enquiries = (enquiriesData as any)?.enquiries || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quote Requests</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quote Requests</h1>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {enquiries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Enquiries Found</h3>
              <p className="text-gray-500">No quote requests match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          enquiries.map((enquiry: Enquiry) => (
            <Card key={enquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{enquiry.subject}</h3>
                      <Badge className={getPriorityBadge(enquiry.priority)}>
                        {enquiry.priority}
                      </Badge>
                      <Badge className={getStatusBadge(enquiry.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(enquiry.status)}
                          <span>{enquiry.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{enquiry.name} ({enquiry.email})</span>
                      </span>
                      {enquiry.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{enquiry.phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(enquiry.createdAt), 'MMM d, yyyy HH:mm')}</span>
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">{enquiry.message}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedEnquiry(enquiry)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Quote Request Details</DialogTitle>
                        </DialogHeader>
                        {selectedEnquiry && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Name</Label>
                                <p className="mt-1">{selectedEnquiry.name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Email</Label>
                                <p className="mt-1">{selectedEnquiry.email}</p>
                              </div>
                              {selectedEnquiry.phone && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                  <p className="mt-1">{selectedEnquiry.phone}</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Priority</Label>
                                <Badge className={`mt-1 ${getPriorityBadge(selectedEnquiry.priority)}`}>
                                  {selectedEnquiry.priority}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Status</Label>
                                <div className="mt-1">
                                  <Select 
                                    value={selectedEnquiry.status}
                                    onValueChange={(status) => updateStatusMutation.mutate({ id: selectedEnquiry.id, status })}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Created</Label>
                                <p className="mt-1">{format(new Date(selectedEnquiry.createdAt), 'MMM d, yyyy HH:mm')}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Subject</Label>
                              <p className="mt-1 font-medium">{selectedEnquiry.subject}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Message</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                <p className="whitespace-pre-wrap">{selectedEnquiry.message}</p>
                              </div>
                            </div>
                            <div className="flex justify-between pt-4">
                              <Button
                                variant="outline"
                                onClick={() => window.open(`mailto:${selectedEnquiry.email}?subject=Re: ${selectedEnquiry.subject}`)}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Reply via Email
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this enquiry?')) {
                                    deleteEnquiryMutation.mutate(selectedEnquiry.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Select 
                      value={enquiry.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: enquiry.id, status })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
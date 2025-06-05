import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface QuoteRequestDialogProps {
  trigger?: React.ReactNode;
}

export function QuoteRequestDialog({ trigger }: QuoteRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    priority: "medium"
  });
  const { toast } = useToast();

  const submitEnquiry = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/enquiries", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          source: "website"
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Sent!",
        description: "Thank you for your enquiry. We'll get back to you within 24 hours.",
      });
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        priority: "medium"
      });
    },
    onError: (error) => {
      console.error("Failed to submit enquiry:", error);
      toast({
        title: "Error",
        description: "Failed to send your quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    submitEnquiry.mutate(formData);
  };

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <MessageSquare className="mr-2 h-5 w-5" />
            Get a Free Quote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Request a Free Quote</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name")(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email")(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone")(e.target.value)}
              placeholder="(03) 1234 5678"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange("subject")(e.target.value)}
                placeholder="What can we help you with?"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={handleChange("priority")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General Enquiry</SelectItem>
                  <SelectItem value="medium">Medium - Quote Request</SelectItem>
                  <SelectItem value="high">High - Urgent Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message")(e.target.value)}
              placeholder="Please provide details about your garage door requirements..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitEnquiry.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitEnquiry.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitEnquiry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Quote Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
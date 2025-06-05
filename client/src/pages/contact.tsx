import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { QuoteRequestDialog } from "@/components/QuoteRequestDialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Send,
  CheckCircle
} from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    details: "(03) 5221 8999",
    description: "Call us for immediate assistance",
    action: "tel:0352218999"
  },
  {
    icon: Mail,
    title: "Email",
    details: "Send us an email",
    description: "info@geelonggaragedoors.com.au",
    action: "mailto:info@geelonggaragedoors.com.au"
  },
  {
    icon: MapPin,
    title: "Service Area",
    details: "Geelong & Surrounding Areas",
    description: "We service all of Geelong region",
    action: null
  },
  {
    icon: Clock,
    title: "Business Hours",
    details: "Mon-Fri: 7AM-5PM",
    description: "Saturday by appointment",
    action: null
  }
];

const serviceAreas = [
  "Geelong",
  "Geelong West",
  "Geelong North",
  "Geelong South",
  "Belmont",
  "Highton",
  "Waurn Ponds",
  "Grovedale",
  "Marshall",
  "Bell Park",
  "Bell Post Hill",
  "Hamlyn Heights",
  "Manifold Heights",
  "Newtown",
  "Rippleside",
  "Thomson",
  "Whittington",
  "Ocean Grove",
  "Barwon Heads",
  "Torquay",
  "Anglesea",
  "Lorne",
  "Winchelsea",
  "Inverleigh",
  "Bannockburn",
  "Teesdale",
  "Fyansford"
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    priority: "medium"
  });
  const { toast } = useToast();

  const enquiryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/enquiries", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you within 24 hours.",
      });
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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enquiryMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2b3990] to-[#1e2871] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Contact Us
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Get in touch with Geelong's trusted garage door specialists. 
            We're here to help with expert advice and professional service.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-[#2b3990] rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{info.title}</h3>
                    {info.action ? (
                      <a 
                        href={info.action}
                        className="text-[#2b3990] font-medium hover:underline block mb-2"
                      >
                        {info.details}
                      </a>
                    ) : (
                      <p className="text-[#2b3990] font-medium mb-2">{info.details}</p>
                    )}
                    <p className="text-gray-600 text-sm">{info.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Send Us a Message</h2>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="(03) 1234 5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority Level</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
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
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        required
                        placeholder="What can we help you with?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        required
                        rows={5}
                        placeholder="Please provide details about your garage door needs..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-[#2b3990] hover:bg-[#1e2871]"
                      disabled={enquiryMutation.isPending}
                    >
                      {enquiryMutation.isPending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Service Areas & Quick Quote */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Service Areas</h3>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <p className="text-gray-600 mb-4">
                      We proudly serve Geelong and the surrounding areas:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {serviceAreas.map((area, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6">Need a Quick Quote?</h3>
                <Card className="border-0 shadow-lg bg-[#2b3990] text-white">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-white" />
                    <h4 className="text-xl font-semibold mb-4">Get Your Free Quote</h4>
                    <p className="mb-6">
                      Use our quick quote form to get an estimate for your garage door project.
                    </p>
                    <QuoteRequestDialog 
                      trigger={
                        <Button size="lg" className="bg-white text-[#2b3990] hover:bg-gray-100">
                          Get Free Quote
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Emergency Service Available</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Garage door not working? Need urgent repairs? We offer emergency service 
            for urgent garage door issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              <Phone className="w-5 h-5 mr-2" />
              Emergency: (03) 5221 8999
            </Button>
            <p className="text-gray-600">Available for urgent repairs</p>
          </div>
        </div>
      </section>

      <StorefrontFooter />
    </div>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UploadButton } from "@/lib/uploadthing";
import { Upload, Send } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  makeModel: z.string().min(1, "Please specify the make or model"),
  message: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function HeroContactForm() {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string>("");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      makeModel: "",
      message: "",
      imageUrl: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest("POST", "/api/contact/hero-form", {
        ...data,
        imageUrl: uploadedImage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
      setUploadedImage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-[#2b3990] text-center">
          Need Help Finding a Part?
        </CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Send us your details and we'll help identify what you need
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="makeModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Make/Model of Part</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. B&D Panel Lift, Merlin Remote"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information that might help..."
                      rows={3}
                      {...field}
                      className="text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Upload Image (Optional)</FormLabel>
              {uploadedImage ? (
                <div className="space-y-2">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded part" 
                    className="w-full h-24 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedImage("")}
                    className="w-full text-xs"
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res.length > 0) {
                        setUploadedImage(res[0].url);
                        toast({
                          title: "Image uploaded",
                          description: "Your image has been attached successfully",
                        });
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast({
                        title: "Upload failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    }}
                    className="ut-button:bg-[#2b3990] ut-button:hover:bg-[#1e2870] ut-button:text-xs ut-allowed-content:text-xs ut-allowed-content:text-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Help us identify your part
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-[#2b3990] hover:bg-[#1e2871] text-white font-medium"
            >
              {submitMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
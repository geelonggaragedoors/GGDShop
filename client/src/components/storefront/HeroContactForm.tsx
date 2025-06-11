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
    <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-[#2b3990] text-center">
          Need Help Finding a Part?
        </CardTitle>
        <p className="text-xs text-gray-600 text-center">
          Send us your details and we'll help identify what you need
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      {...field}
                      className="text-xs h-8"
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
                  <FormLabel className="text-xs font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      {...field}
                      className="text-xs h-8"
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
                  <FormLabel className="text-xs font-medium">Make/Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. B&D Panel Lift"
                      {...field}
                      className="text-xs h-8"
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
                  <FormLabel className="text-xs font-medium">Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional info..."
                      rows={2}
                      {...field}
                      className="text-xs resize-none h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-1">
              <FormLabel className="text-xs font-medium">Upload Image (Optional)</FormLabel>
              {uploadedImage ? (
                <div className="space-y-1">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded part" 
                    className="w-full h-16 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedImage("")}
                    className="w-full text-xs h-6"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center">
                  <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
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
                    className="ut-button:bg-[#2b3990] ut-button:hover:bg-[#1e2870] ut-button:text-xs ut-button:py-1 ut-button:px-2 ut-allowed-content:text-xs ut-allowed-content:text-gray-600"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-[#2b3990] hover:bg-[#1e2871] text-white font-medium text-xs h-8"
            >
              {submitMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
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
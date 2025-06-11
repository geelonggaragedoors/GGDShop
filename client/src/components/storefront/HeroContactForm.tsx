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
  make: z.string().min(1, "Please specify the make"),
  model: z.string().min(1, "Please specify the model"),
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
      make: "",
      model: "",
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
    <Card className="w-full max-w-xs bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm text-[#2b3990] text-center leading-tight">
          Need Help Finding a Part?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Name and Email side by side */}
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                        className="text-xs h-7 border-gray-300"
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
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        {...field}
                        className="text-xs h-7 border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Make and Model as separate fields */}
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Input
                        placeholder="Make (e.g. B&D)"
                        {...field}
                        className="text-xs h-7 border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Input
                        placeholder="Model (e.g. Panel Lift)"
                        {...field}
                        className="text-xs h-7 border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Combined message and image upload */}
            <div className="space-y-1">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Textarea
                        placeholder="Additional details (optional)..."
                        rows={2}
                        {...field}
                        className="text-xs resize-none h-10 border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Compact Image Upload */}
              {uploadedImage ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                  <img 
                    src={uploadedImage} 
                    alt="Part" 
                    className="w-8 h-8 object-cover rounded border"
                  />
                  <span className="text-xs text-green-700 flex-1">Image attached</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedImage("")}
                    className="text-xs h-6 px-2 text-green-700 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-center">
                    <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <div className="space-y-1">
                      <div 
                        className="upload-button-override"
                        style={{
                          '--ut-button-color': 'white',
                          '--ut-button-bg': '#2b3990',
                          '--ut-button-hover-bg': '#1e2871'
                        } as React.CSSProperties}
                      >
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
                          className="ut-button:text-xs ut-button:h-6 ut-button:px-3 ut-button:rounded ut-button:font-medium ut-allowed-content:hidden"
                          content={{
                            button: "📷 Upload Image"
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">One image only (4MB max)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-[#2b3990] hover:bg-[#1e2871] text-white font-medium text-xs h-7"
            >
              {submitMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
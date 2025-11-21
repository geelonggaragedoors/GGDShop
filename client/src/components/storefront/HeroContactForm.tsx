import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// UploadThing removed - using local uploads
import { Upload, Send, Loader2 } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  make: z.string().min(1, "Please specify the make"),
  makeOther: z.string().optional(),
  model: z.string().min(1, "Please specify the model"),
  message: z.string().optional(),
  imageUrls: z.array(z.string()).min(1, "Please upload at least one image"),
}).refine((data) => {
  // If "Other" is selected for make, makeOther must be provided
  if (data.make === "Other" && (!data.makeOther || data.makeOther.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the make when 'Other' is selected",
  path: ["makeOther"],
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function HeroContactForm() {
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Fetch brands from admin system
  const { data: brands = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/brands"],
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      make: "",
      makeOther: "",
      model: "",
      message: "",
      imageUrls: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest("POST", "/api/contact/hero-form", {
        ...data,
        imageUrls: uploadedImages,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
      setUploadedImages([]);
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
    <Card className="w-full max-w-lg bg-white/95 backdrop-blur-sm shadow-xl">
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedMake(value);
                          if (value !== "Other") {
                            form.setValue("makeOther", "");
                          }
                        }}
                        value={field.value}
                      >
                        <SelectTrigger className="text-xs h-7 border-gray-300">
                          <SelectValue placeholder="Select make" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.name}>
                              {brand.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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

            {/* Show text input when "Other" is selected for make */}
            {selectedMake === "Other" && (
              <FormField
                control={form.control}
                name="makeOther"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Input
                        placeholder="Please specify the make"
                        {...field}
                        className="text-xs h-7 border-gray-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              
              {/* Multiple Image Upload */}
              {uploadedImages.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Part ${index + 1}`} 
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newImages = uploadedImages.filter((_, i) => i !== index);
                            setUploadedImages(newImages);
                            form.setValue("imageUrls", newImages);
                          }}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 bg-red-500 hover:bg-red-600 text-white text-xs"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-600">{uploadedImages.length} image(s) attached</p>
                </div>
              ) : null}
              
              {isUploading ? (
                <div className="border-2 border-dashed border-blue-300 rounded p-4 bg-blue-50">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
                    <p className="text-xs text-blue-600">Uploading images...</p>
                  </div>
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
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            
                            setIsUploading(true);
                            
                            try {
                              const uploadPromises = files.map(async (file) => {
                                const formData = new FormData();
                                formData.append('file', file);
                                
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData,
                                });
                                
                                if (!response.ok) {
                                  throw new Error(`Failed to upload ${file.name}`);
                                }
                                
                                const result = await response.json();
                                return result.file?.url || result.url;
                              });
                              
                              const newUrls = await Promise.all(uploadPromises);
                              const allImages = [...uploadedImages, ...newUrls];
                              setUploadedImages(allImages);
                              form.setValue("imageUrls", allImages);
                              
                              toast({
                                title: "Images uploaded",
                                description: `${files.length} image(s) attached successfully`,
                              });
                            } catch (error) {
                              toast({
                                title: "Upload failed",
                                description: error instanceof Error ? error.message : 'Upload failed',
                                variant: "destructive",
                              });
                            } finally {
                              setIsUploading(false);
                              // Reset the input
                              e.target.value = '';
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#2b3990] file:text-white hover:file:bg-[#1e2871] file:cursor-pointer cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Multiple images allowed (4MB max each)</p>
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
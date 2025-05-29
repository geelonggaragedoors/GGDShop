import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import DataTable from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Upload, Plus, Search, Trash2, Download, Image, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Media() {
  const [search, setSearch] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const { data: mediaFiles, isLoading } = useQuery({
    queryKey: ["/api/admin/media"],
    queryFn: () => fetch('/api/admin/media').then(res => res.json()),
  });

  const uploadMutation = useMutation({
    mutationFn: (fileData: any) => fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      setIsUploadOpen(false);
      toast({ title: "File uploaded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "File deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm({
    defaultValues: {
      filename: "",
      originalName: "",
      mimeType: "",
      size: 0,
      url: "",
      alt: "",
    },
  });

  const onSubmit = (data: any) => {
    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return FileText;
  };

  const filteredFiles = mediaFiles?.filter((file: any) =>
    file.originalName.toLowerCase().includes(search.toLowerCase()) ||
    file.alt?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const columns = [
    {
      header: "File",
      accessorKey: "filename",
      cell: ({ row }: any) => {
        const Icon = getFileIcon(row.original.mimeType);
        return (
          <div className="flex items-center space-x-3">
            {row.original.mimeType.startsWith('image/') ? (
              <img 
                src={row.original.url} 
                alt={row.original.alt || row.original.originalName}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{row.original.originalName}</p>
              <p className="text-sm text-gray-500">{row.original.mimeType}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Size",
      accessorKey: "size",
      cell: ({ row }: any) => (
        <span className="text-gray-600">{formatFileSize(row.original.size)}</span>
      ),
    },
    {
      header: "Alt Text",
      accessorKey: "alt",
      cell: ({ row }: any) => (
        <span className="text-gray-600">{row.original.alt || "—"}</span>
      ),
    },
    {
      header: "Uploaded",
      accessorKey: "createdAt",
      cell: ({ row }: any) => (
        <span className="text-gray-600">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => window.open(row.original.url, '_blank')}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-600 hover:text-red-700"
            onClick={() => deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
              <p className="text-gray-600">Manage images and files</p>
            </div>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New File</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="originalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="garage-door-image.jpg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mimeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MIME Type</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="image/jpeg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alt Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Description for accessibility" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2 pt-4">
                      <Button type="submit" disabled={uploadMutation.isPending}>
                        Upload
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search files..."
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
          data={filteredFiles}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
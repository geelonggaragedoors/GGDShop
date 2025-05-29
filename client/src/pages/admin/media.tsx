import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Upload, Plus, Search, Trash2, Download, Image, FileText, File, FolderPlus, Folder, Copy, Eye, Grid, List, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  folder: string;
  createdAt: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parent: string;
  createdAt: string;
}

export default function Media() {
  const [search, setSearch] = useState("");
  const [currentFolder, setCurrentFolder] = useState("root");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ["/api/admin/media", currentFolder],
    queryFn: () => fetch(`/api/admin/media?folder=${currentFolder}`).then(res => res.json()),
  });

  const uploadMutation = useMutation({
    mutationFn: (fileData: any) => fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "File uploaded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (folderData: any) => fetch('/api/admin/media/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folderData),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media", currentFolder] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      setIsCreateFolderOpen(false);
      folderForm.reset();
      toast({ title: "Folder created successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "File deleted successfully" });
    },
  });

  const folderForm = useForm({
    defaultValues: {
      name: "",
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileUpload(file));
  }, [currentFolder]);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, PDF, and TXT files are allowed", variant: "destructive" });
      return;
    }

    // Simulate file upload - in real implementation, you'd upload to a file storage service
    const fileData = {
      filename: `${Date.now()}-${file.name}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file), // In production, this would be the actual uploaded file URL
      folder: currentFolder,
      alt: "",
    };

    uploadMutation.mutate(fileData);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleFileUpload(file));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType === 'text/plain') return File;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied to clipboard" });
  };

  const onCreateFolder = (data: any) => {
    createFolderMutation.mutate({
      name: data.name,
      parent: currentFolder,
    });
  };

  const folders = mediaData?.folders || [];
  const files = mediaData?.files || [];
  
  const filteredFiles = files.filter((file: MediaFile) =>
    file.originalName.toLowerCase().includes(search.toLowerCase()) ||
    file.alt?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
              <p className="text-gray-600">Manage images, documents, and files</p>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <Form {...folderForm}>
                    <form onSubmit={folderForm.handleSubmit(onCreateFolder)} className="space-y-4">
                      <FormField
                        control={folderForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Folder Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter folder name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2 pt-4">
                        <Button type="submit" disabled={createFolderMutation.isPending}>
                          Create
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {currentFolder !== "root" && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentFolder("root")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex-1 relative">
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-80"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors cursor-pointer hover:border-primary/50 ${
          isDragOver ? 'border-primary bg-primary/10' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop files here</p>
          <p className="text-gray-600 mb-2">Supports JPG, PNG, PDF, and TXT files</p>
          <p className="text-sm text-gray-500">or click to browse files</p>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder: MediaFolder) => (
                <div
                  key={folder.id}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <Folder className="w-12 h-12 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-center">{folder.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Files ({filteredFiles.length})</h3>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file: MediaFile) => {
                const IconComponent = getFileIcon(file.mimeType);
                return (
                  <div key={file.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {file.mimeType.startsWith('image/') ? (
                        <img 
                          src={file.url} 
                          alt={file.alt || file.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent className="w-12 h-12 text-gray-600" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <div className="flex space-x-1 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => copyUrlToClipboard(file.url)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(file.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file: MediaFile) => {
                const IconComponent = getFileIcon(file.mimeType);
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {file.mimeType.startsWith('image/') ? (
                        <img 
                          src={file.url} 
                          alt={file.alt || file.originalName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{file.originalName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{file.mimeType}</span>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{format(new Date(file.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => copyUrlToClipboard(file.url)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(file.url, '_blank')}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(file.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">Upload some files to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Preview Dialog */}
      {selectedFileUrl && (
        <Dialog open={!!selectedFileUrl} onOpenChange={() => setSelectedFileUrl(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={selectedFileUrl} readOnly />
              <Button onClick={() => copyUrlToClipboard(selectedFileUrl)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
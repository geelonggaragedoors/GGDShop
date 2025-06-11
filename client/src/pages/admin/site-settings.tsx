import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  type: string | null;
  category: string | null;
  updatedAt: string | null;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings']
  });

  useEffect(() => {
    if (settings) {
      const initialData: Record<string, string> = {};
      settings.forEach((setting: SiteSetting) => {
        initialData[setting.key] = setting.value || '';
      });
      setFormData(initialData);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        apiRequest("PUT", `/api/admin/site-settings/${key}`, { value })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings/hero'] });
      setIsDirty(false);
      toast({
        title: "Settings updated",
        description: "Site settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading site settings...</span>
        </div>
      </div>
    );
  }

  const heroSettings = settings?.filter((s: SiteSetting) => s.category === 'hero') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-gray-600 mt-2">Configure your website's appearance and content</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || updateMutation.isPending}
          className="bg-[#2b3990] hover:bg-[#1e2871]"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#2b3990]">Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {heroSettings.map((setting: SiteSetting) => (
            <div key={setting.key} className="space-y-2">
              <Label htmlFor={setting.key} className="text-sm font-medium">
                {setting.description || setting.key}
              </Label>
              {setting.type === 'textarea' ? (
                <Textarea
                  id={setting.key}
                  value={formData[setting.key] || ''}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  placeholder={setting.description || ''}
                  rows={3}
                  className="resize-none"
                />
              ) : setting.type === 'image' ? (
                <div className="space-y-2">
                  <Input
                    id={setting.key}
                    type="url"
                    value={formData[setting.key] || ''}
                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData[setting.key] && (
                    <div className="mt-2">
                      <img
                        src={formData[setting.key]}
                        alt="Preview"
                        className="w-full max-w-md h-32 object-cover rounded-md border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  id={setting.key}
                  value={formData[setting.key] || ''}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  placeholder={setting.description || ''}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {isDirty && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 mb-2">You have unsaved changes</p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (settings) {
                  const resetData: Record<string, string> = {};
                  settings.forEach(setting => {
                    resetData[setting.key] = setting.value || '';
                  });
                  setFormData(resetData);
                  setIsDirty(false);
                }
              }}
            >
              Discard
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-[#2b3990] hover:bg-[#1e2871]"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
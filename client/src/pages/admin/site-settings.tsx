import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// UploadThing removed - using local uploads

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
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Percentage-based positioning

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
      
      // Initialize image position from custom position setting
      const customPosition = settings.find(s => s.key === 'hero_image_position_custom')?.value;
      if (customPosition) {
        const [x, y] = customPosition.split(' ').map(pos => parseFloat(pos.replace('%', '')));
        setImagePosition({ x: x || 50, y: y || 50 });
      }
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

  const handleImagePositionChange = (x: number, y: number) => {
    setImagePosition({ x, y });
    // Convert percentage to CSS background-position value
    const positionValue = `${x}% ${y}%`;
    handleInputChange('hero_image_position_custom', positionValue);
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
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      id={setting.key}
                      type="url"
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      placeholder="https://example.com/image.jpg or upload below"
                      className="flex-1"
                    />
                    {formData[setting.key] && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange(setting.key, '')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        Upload a new hero image
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          try {
                            const response = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            
                            if (response.ok) {
                              const result = await response.json();
                              console.log('Upload response:', result);
                              console.log('Image URL:', result.file?.url || result.url);
                              const imageUrl = result.file?.url || result.url; // Handle both response formats
                              handleInputChange(setting.key, imageUrl);
                              
                              // Auto-save after upload
                              try {
                                await updateMutation.mutateAsync({ [setting.key]: imageUrl });
                                toast({
                                  title: "Image uploaded and saved",
                                  description: "Hero image has been uploaded and saved successfully",
                                });
                              } catch (saveError) {
                                toast({
                                  title: "Image uploaded but save failed",
                                  description: "Image uploaded but failed to save. Please click Save Changes.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              throw new Error('Upload failed');
                            }
                          } catch (error) {
                            toast({
                              title: "Upload failed",
                              description: error instanceof Error ? error.message : 'Upload failed',
                              variant: "destructive",
                            });
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2b3990] file:text-white hover:file:bg-[#1e2870]"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        PNG, JPG, GIF up to 4MB
                      </p>
                    </div>
                  </div>
                  
                  {formData[setting.key] && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Image Preview & Positioning</Label>
                        <span className="text-xs text-gray-500">
                          Drag the image to position it
                        </span>
                      </div>
                      
                      {/* Interactive Image Preview */}
                      <div className="relative w-full max-w-2xl">
                        {/* Hero Section Preview */}
                        <div 
                          className="relative h-48 rounded-lg overflow-hidden border-2 border-gray-300 cursor-move bg-gray-200"
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaY = moveEvent.clientY - startY;
                              
                              const newX = Math.max(0, Math.min(100, imagePosition.x + (deltaX / rect.width) * 100));
                              const newY = Math.max(0, Math.min(100, imagePosition.y + (deltaY / rect.height) * 100));
                              
                              handleImagePositionChange(newX, newY);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        >
                          {/* Background Image */}
                          {formData[setting.key] && (
                            <img
                              src={formData[setting.key]}
                              alt="Hero background"
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{
                                objectFit: 'cover',
                                objectPosition: formData['hero_image_position_custom'] || '50% 50%',
                                transform: `scale(${(() => {
                                  const zoom = parseFloat(formData['hero_image_zoom']) || 100;
                                  // If zoom is already a decimal (like 1.0), use it directly
                                  // If zoom is a percentage (like 100), convert to decimal
                                  return zoom <= 10 ? zoom : zoom / 100;
                                })()})`,
                                transformOrigin: formData['hero_image_position_custom'] || '50% 50%'
                              }}
                              onError={(e) => {
                                console.error('Image failed to load:', formData[setting.key]);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', formData[setting.key]);
                              }}
                            />
                          )}
                          {/* Dark overlay like the actual hero */}
                          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                          
                          {/* Preview content */}
                          <div className="relative z-10 p-6 text-white h-full flex items-center">
                            <div>
                              <h3 className="text-2xl font-bold mb-2">
                                {formData['hero_title'] || 'Hero Title'}
                              </h3>
                              <p className="text-sm opacity-90">
                                {formData['hero_subtitle'] || 'Hero subtitle text'}
                              </p>
                              <div className="mt-3 flex space-x-2">
                                <div className="px-3 py-1 bg-blue-600 rounded text-xs">Shop Now</div>
                                <div className="px-3 py-1 border border-white rounded text-xs">Get Quote</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Position indicator */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {Math.round(imagePosition.x)}%, {Math.round(imagePosition.y)}%
                          </div>
                        </div>
                        
                        {/* Position Controls */}
                        <div className="mt-3 grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-600">Horizontal Position</Label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={imagePosition.x}
                              onChange={(e) => handleImagePositionChange(Number(e.target.value), imagePosition.y)}
                              className="w-full mt-1"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Left</span>
                              <span>Center</span>
                              <span>Right</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-600">Vertical Position</Label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={imagePosition.y}
                              onChange={(e) => handleImagePositionChange(imagePosition.x, Number(e.target.value))}
                              className="w-full mt-1"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Top</span>
                              <span>Center</span>
                              <span>Bottom</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-600">Zoom Level</Label>
                            <input
                              type="range"
                              min="50"
                              max="200"
                              value={formData['hero_image_zoom'] || '100'}
                              onChange={(e) => handleInputChange('hero_image_zoom', e.target.value)}
                              className="w-full mt-1"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>Out</span>
                              <span>{formData['hero_image_zoom'] || '100'}%</span>
                              <span>In</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Preset Buttons */}
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-gray-600 mb-1">Quick Positions:</div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(0, 0)}
                              className="text-xs"
                            >
                              Left Top
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(50, 0)}
                              className="text-xs"
                            >
                              Top Center
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(100, 0)}
                              className="text-xs"
                            >
                              Right Top
                            </Button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(0, 50)}
                              className="text-xs"
                            >
                              Left
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(50, 50)}
                              className="text-xs"
                            >
                              Center
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(100, 50)}
                              className="text-xs"
                            >
                              Right
                            </Button>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(0, 100)}
                              className="text-xs"
                            >
                              Left Bottom
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(50, 100)}
                              className="text-xs"
                            >
                              Bottom Center
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleImagePositionChange(100, 100)}
                              className="text-xs"
                            >
                              Right Bottom
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : setting.type === 'select' ? (
                <Select 
                  value={formData[setting.key] || ''} 
                  onValueChange={(value) => handleInputChange(setting.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={setting.description || 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.key === 'hero_image_position' && (
                      <>
                        <SelectItem value="top">Top - Show upper portion of image</SelectItem>
                        <SelectItem value="center">Center - Show middle portion of image</SelectItem>
                        <SelectItem value="bottom">Bottom - Show lower portion of image</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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
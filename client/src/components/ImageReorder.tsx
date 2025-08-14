import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ImageReorderProps {
  images: { id: string; url: string; filename?: string; originalName?: string; alt?: string; size?: number }[];
  onReorder: (newOrder: { id: string; url: string; filename?: string; originalName?: string; alt?: string; size?: number }[]) => void;
  onRemove?: (imageId: string) => void;
  className?: string;
  showPreview?: boolean;
}

export function ImageReorder({ images, onReorder, onRemove, className = '', showPreview = true }: ImageReorderProps) {
  const [localImages, setLocalImages] = useState([...images]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sync with prop changes
  useEffect(() => {
    setLocalImages([...images]);
  }, [images]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalImages(items);
    onReorder(items);
  };

  if (!images || images.length === 0) {
    return null;
  }

  // For single images, show a simplified version without drag/drop but with AI tools
  if (images.length === 1) {
    const image = images[0];
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Product Image
          </p>
          <span className="text-xs text-gray-500">1 image</span>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg border-gray-200">
          <div className="relative">
            <img
              src={image.url}
              alt={image.alt || image.filename || 'Product image'}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {image.originalName || image.filename || 'Product Image'}
            </p>
            <p className="text-xs text-gray-500">
              {image.size ? `${Math.round(image.size / 1024)}KB` : 'Image file'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {showPreview && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Image Preview</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center">
                    <img
                      src={image.url}
                      alt={image.alt || image.filename || 'Product image'}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(image.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Reorder Images (drag to rearrange)
        </p>
        <span className="text-xs text-gray-500">{images.length} images</span>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
            >
              {localImages.map((image, index) => (
                <Draggable key={`${image.id}-${index}`} draggableId={`${image.id}-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        flex items-center space-x-3 p-3 bg-white border rounded-lg
                        ${snapshot.isDragging ? 'shadow-lg border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                        transition-all duration-200
                      `}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical size={16} />
                      </div>
                      
                      <img
                        src={image.url}
                        alt={image.alt || `Product image ${index + 1}`}
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=48&h=48&fit=crop&crop=center";
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {image.filename || image.originalName || `Image ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {index === 0 ? 'Main Image' : 'Additional Image'}
                        </p>
                      </div>



                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={() => onRemove(image.id)}
                        >
                          <X size={14} />
                        </Button>
                      )}
                      
                      {showPreview && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setPreviewImage(image.url)}
                            >
                              <Eye size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Image Preview - {image.filename || `Position ${index + 1}`}</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center">
                              <img
                                src={image.url}
                                alt={image.alt || `Product image ${index + 1}`}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=center";
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <div className="text-xs text-gray-400 font-mono">
                        #{index + 1}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {localImages.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> The first image will be used as the main product image on the storefront.
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageReorder;
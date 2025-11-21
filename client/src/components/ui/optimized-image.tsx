import { useState } from "react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl, handleImageError } from "@/lib/imageUtils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  type?: 'product' | 'category';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes,
  type = 'product',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Normalize the source URL using the unified image utilities
  const normalizedSrc = normalizeImageUrl(src, type);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleErrorEvent = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    // Use the unified error handler for consistent fallback behavior
    handleImageError(e, type);
    onError?.();
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7v2.99s-1.99.01-2 0V7c0-1.1-.9-2-2-2s-2 .9-2 2v3H9V7c0-2.76 2.24-5 5-5s5 2.24 5 5zM9 21H7v-7h2v7zm4 0h-2v-7h2v7zm4 0h-2v-7h2v7z"/>
            </svg>
          </div>
        </div>
      )}
      <img
        src={normalizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes={sizes}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleErrorEvent}
      />
    </div>
  );
}
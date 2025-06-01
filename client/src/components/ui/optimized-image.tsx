import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
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
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback image for errors
  const fallbackSrc = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE2MlYxMzhIMTc1VjEyNVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+PC9wPgo8L3N2Zz4K";

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
        src={hasError ? fallbackSrc : src}
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
        onError={handleError}
      />
    </div>
  );
}
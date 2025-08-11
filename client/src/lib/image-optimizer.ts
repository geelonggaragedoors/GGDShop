export function getOptimizedImageUrl(src: string | null | undefined, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
} = {}): string {
  const { width = 800, height, quality = 80, format = 'webp' } = options;
  
  // Handle null, undefined, or empty string
  if (!src || typeof src !== 'string') {
    return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  }
  
  // For local uploaded images (starts with /uploads/), return as-is
  // The browser will resolve relative URLs correctly
  if (src.startsWith('/uploads/')) {
    return src;
  }
  
  // If it's already an optimized URL or external service, return as-is
  if (src.includes('unsplash.com') || src.includes('uploadthing.com')) {
    // For Unsplash, add optimization parameters
    if (src.includes('unsplash.com')) {
      const url = new URL(src);
      url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fm', format);
      url.searchParams.set('fit', 'crop');
      return url.toString();
    }
    return src;
  }
  
  // For UploadThing URLs, we can add transformation parameters
  if (src.includes('uploadthing')) {
    return `${src}?w=${width}&h=${height || width}&q=${quality}&f=${format}`;
  }
  
  return src;
}

export function generateSrcSet(src: string | null | undefined, sizes: number[] = [400, 800, 1200]): string {
  // Handle null, undefined, or empty string
  if (!src || typeof src !== 'string') {
    const fallbackUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
    return fallbackUrl;
  }
  
  // For local uploaded images, just return the single source
  if (src.startsWith('/uploads/')) {
    return src;
  }
  
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { width: size })} ${size}w`)
    .join(', ');
}

export function generateSizes(breakpoints: { size: string; width: number }[] = [
  { size: '(max-width: 768px)', width: 400 },
  { size: '(max-width: 1200px)', width: 800 },
  { size: '100vw', width: 1200 }
]): string {
  return breakpoints
    .map(bp => `${bp.size} ${bp.width}px`)
    .join(', ');
}
/**
 * Image optimization utilities for external image services
 * Focuses on optimization while imageUtils.ts handles path normalization
 */

import { normalizeImageUrl } from './imageUtils';

export function getOptimizedImageUrl(src: string | null | undefined, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
} = {}): string {
  const { width = 800, height, quality = 80, format = 'webp' } = options;
  
  // First normalize the image URL to ensure correct path
  const normalizedSrc = normalizeImageUrl(src, 'product');
  
  // For local uploaded images (starts with /uploads/), return as-is
  // The browser will resolve relative URLs correctly
  if (normalizedSrc.startsWith('/uploads/')) {
    return normalizedSrc;
  }
  
  // For Unsplash images, add optimization parameters
  if (normalizedSrc.includes('unsplash.com')) {
    try {
      const url = new URL(normalizedSrc);
      url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fm', format);
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return normalized source
      return normalizedSrc;
    }
  }
  
  return normalizedSrc;
}

export function generateSrcSet(src: string | null | undefined, sizes: number[] = [400, 800, 1200]): string {
  // First normalize the image URL
  const normalizedSrc = normalizeImageUrl(src, 'product');
  
  // For local uploaded images, just return the single source
  if (normalizedSrc.startsWith('/uploads/')) {
    return normalizedSrc;
  }
  
  return sizes
    .map(size => `${getOptimizedImageUrl(normalizedSrc, { width: size })} ${size}w`)
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
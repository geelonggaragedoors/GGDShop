import type { SyntheticEvent } from 'react';

/**
 * Image utility functions for handling product images with fallbacks
 */

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800';

/**
 * Get the full image URL, handling both relative and absolute paths
 * Works on both localhost and production domains
 */
export function getImageUrl(imagePath: string | null | undefined, type: 'product' | 'category' = 'product'): string {
  if (!imagePath) {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }

  // If already a full URL (starts with http), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path (starts with /uploads/), return as-is
  // Express will serve it correctly via express.static
  if (imagePath.startsWith('/uploads/')) {
    return imagePath;
  }

  // If path already contains 'uploads/' prefix (without leading slash), add only the leading slash
  if (imagePath.startsWith('uploads/')) {
    return `/${imagePath}`;
  }

  // If it doesn't start with /, add /uploads/ prefix
  if (!imagePath.startsWith('/')) {
    return `/uploads/${imagePath}`;
  }

  return imagePath;
}

/**
 * Get the first image from an array of images
 */
export function getFirstImage(images: string[] | null | undefined, type: 'product' | 'category' = 'product'): string {
  if (!images || images.length === 0) {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }
  
  return getImageUrl(images[0], type);
}

/**
 * Handle image load errors by setting a fallback image
 */
export function handleImageError(event: SyntheticEvent<HTMLImageElement>, type: 'product' | 'category' = 'product') {
  const img = event.currentTarget;
  const fallbackUrl = type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  
  // Prevent infinite loop if fallback also fails
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  }
}

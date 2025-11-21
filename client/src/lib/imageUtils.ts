/**
 * Unified image utility functions for handling product and category images
 * Provides consistent URL normalization, fallback images, and error handling
 */

import { SyntheticEvent } from 'react';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800';

/**
 * Normalize an image URL to ensure consistent format
 * Handles all possible image path formats and ensures proper /uploads/ prefix for local images
 * 
 * @param imagePath - The image path to normalize (filename, relative path, absolute path, or full URL)
 * @param type - The type of image ('product' or 'category') for fallback selection
 * @returns Normalized image URL or fallback image if invalid
 */
export function normalizeImageUrl(imagePath: string | null | undefined, type: 'product' | 'category' = 'product'): string {
  if (!imagePath || imagePath.trim() === '') {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }

  // Clean the path
  const cleanPath = imagePath.trim();

  // If already a full URL (starts with http), return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // If it's a relative path (starts with /uploads/), return as-is
  // Express will serve it correctly via express.static
  if (cleanPath.startsWith('/uploads/')) {
    return cleanPath;
  }

  // If path already contains 'uploads/' prefix (without leading slash), add only the leading slash
  if (cleanPath.startsWith('uploads/')) {
    return `/${cleanPath}`;
  }

  // If it's just a filename or relative path, add /uploads/ prefix
  if (!cleanPath.startsWith('/')) {
    return `/uploads/${cleanPath}`;
  }

  // If it starts with / but not /uploads/, return as-is to avoid misrouting valid URLs
  // Only product images are guaranteed to be either full URLs or already under /uploads/
  if (cleanPath.startsWith('/') && !cleanPath.startsWith('/uploads/')) {
    return cleanPath;
  }

  return cleanPath;
}

/**
 * Get the full image URL, handling both relative and absolute paths
 * Uses normalizeImageUrl internally for consistent path handling
 * 
 * @param imagePath - The image path to process
 * @param type - The type of image ('product' or 'category') for fallback selection
 * @returns Normalized image URL
 */
export function getImageUrl(imagePath: string | null | undefined, type: 'product' | 'category' = 'product'): string {
  return normalizeImageUrl(imagePath, type);
}

/**
 * Normalize an array of image URLs with robust JSON string handling
 * Accepts string | string[] | null | undefined (matching types used in getFirstImage)
 * 
 * @param images - Image data (array, JSON string, or null/undefined)
 * @param type - The type of images ('product' or 'category') for normalization
 * @returns Array of normalized image URLs
 */
export function normalizeImageArray(images: string | string[] | null | undefined, type: 'product' | 'category' = 'product'): string[] {
  if (!images) {
    return [];
  }
  
  let imageArray: string[] = [];
  
  // Check if images is a string; if so, attempt JSON.parse and fall back to single-element array if parsing fails
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        imageArray = parsed;
      } else {
        // If it's just a single image URL string
        imageArray = [images];
      }
    } catch (e) {
      // If JSON parsing fails, treat as single image URL
      imageArray = [images];
    }
  } else if (Array.isArray(images)) {
    imageArray = images;
  } else {
    return [];
  }
  
  // Ensure the result is an array of strings, defaulting to empty array when invalid
  return imageArray
    .filter(img => img && typeof img === 'string' && img.trim() !== '')
    .map(img => normalizeImageUrl(img, type));
}

/**
 * Get the first image from an array of images with robust type checking
 * Handles JSON strings, arrays, and various edge cases
 * 
 * @param images - Image data (array, JSON string, or single URL)
 * @param type - The type of image ('product' or 'category') for fallback selection
 * @returns First normalized image URL or fallback image
 */
export function getFirstImage(images: string[] | string | null | undefined, type: 'product' | 'category' = 'product'): string {
  if (!images) {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }
  
  // Handle case where images might be a JSON string
  let imageArray: string[] = [];
  
  if (typeof images === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        imageArray = parsed;
      } else {
        // If it's just a single image URL string
        imageArray = [images];
      }
    } catch (e) {
      // If JSON parsing fails, treat as single image URL
      imageArray = [images];
    }
  } else if (Array.isArray(images)) {
    imageArray = images;
  } else {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }
  
  if (imageArray.length === 0) {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }
  
  return normalizeImageUrl(imageArray[0], type);
}

/**
 * Handle image loading errors with consistent fallback behavior
 * 
 * @param event - The error event from the img element
 * @param type - The type of image ('product' or 'category') for fallback selection
 */
export function handleImageError(event: SyntheticEvent<HTMLImageElement>, type: 'product' | 'category' = 'product') {
  const img = event.currentTarget;
  const fallbackUrl = type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  
  // Only set fallback if not already set to prevent infinite loops
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  }
}

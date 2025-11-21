/**
 * Server-side image URL normalization utilities
 * Mirrors the client-side imageUtils.ts functionality
 */

/**
 * Normalize image URL to ensure consistent format
 * @param imagePath - The image path to normalize
 * @param type - The type of image ('product' or 'category')
 * @returns Normalized image URL
 */
function normalizeImageUrl(imagePath: string | null | undefined, type: 'product' | 'category' = 'product'): string {
  const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
  const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800';
  
  if (!imagePath || imagePath.trim() === '') {
    return type === 'product' ? DEFAULT_PRODUCT_IMAGE : DEFAULT_CATEGORY_IMAGE;
  }

  const cleanPath = imagePath.trim();

  // If already a full URL (starts with http), return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // If it's a relative path (starts with /uploads/), return as-is
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
 * Normalize an array of image URLs
 * @param images - Array of image URLs or JSON string
 * @param type - The type of images ('product' or 'category')
 * @returns Array of normalized image URLs
 */
function normalizeImageArray(images: unknown, type: 'product' | 'category' = 'product'): string[] {
  if (!images) return [];
  
  let imageArray = images;
  
  // If it's a string, try to parse as JSON
  if (typeof images === 'string') {
    try {
      imageArray = JSON.parse(images);
    } catch (e) {
      // If parsing fails, treat as single image
      return [normalizeImageUrl(images, type)];
    }
  }
  
  // If not an array, convert to array
  if (!Array.isArray(imageArray)) {
    return [normalizeImageUrl(String(imageArray), type)];
  }
  
  // Filter out empty/null values and normalize each URL
  return imageArray
    .filter(img => img && typeof img === 'string' && img.trim() !== '')
    .map(img => normalizeImageUrl(img, type));
}

export {
  normalizeImageUrl,
  normalizeImageArray
};

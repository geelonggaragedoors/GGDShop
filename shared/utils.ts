/**
 * Shared utility functions for both frontend and backend
 */

/**
 * Generate WordPress-compatible slug from a title
 * Faithfully replicates WordPress's sanitize_title() function
 * 
 * @param title - The title to convert to a slug
 * @returns WordPress-compatible slug
 * 
 * @example
 * generateSlug("Café & Restaurant") // "cafe-restaurant"
 * generateSlug("Premium Roller Door - 20mm") // "premium-roller-door-20mm"
 */
export function generateSlug(title: string): string {
  // Transliteration map for common non-ASCII characters
  const translitMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
    'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i',
    'î': 'i', 'ï': 'i', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ö': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y',
    'ÿ': 'y', 'ß': 'ss', 'œ': 'oe'
  };

  return title
    .toLowerCase()
    .trim()
    // Transliterate non-ASCII characters (e.g., Café → cafe)
    .split('').map(char => translitMap[char] || char).join('')
    // Remove HTML entities
    .replace(/&amp;/g, '')
    .replace(/&[a-z]+;/g, '')
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Trim hyphens from start and end
    .replace(/^-+|-+$/g, '');
}

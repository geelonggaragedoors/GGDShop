# Unified Image System Documentation

## Overview

The Geelong Garage Doors application uses a unified image system that provides consistent URL normalization, fallback images, and error handling across all components. This system ensures that product and category images are displayed correctly regardless of how they are stored in the database.

## Architecture

### Core Components

1. **`imageUtils.ts`** - Core path normalization and utility functions
2. **`image-optimizer.ts`** - Optimization for external image services  
3. **Server-side upload handling** - Routes and file storage management
4. **Database migration script** - Fixes existing inconsistent image paths

### Image Storage

- **Database**: Images are stored as JSONB arrays in the `products.images` field
- **File System**: Uploaded images are stored in the `/uploads` directory
- **Server**: Express static middleware serves files from `/uploads` at the `/uploads/` URL path

## Core Functions

### `normalizeImageUrl(imagePath, type)`

The primary function that ensures consistent image URL format.

**Handles all possible image path formats:**
- Just filenames: `image.jpg` → `/uploads/image.jpg`
- Relative paths without leading slash: `uploads/image.jpg` → `/uploads/image.jpg`  
- Relative paths with leading slash: `/uploads/image.jpg` → `/uploads/image.jpg` (unchanged)
- Root-relative paths (non-uploads): `/media/image.jpg` → `/media/image.jpg` (unchanged to avoid misrouting)
- Full URLs: `https://example.com/image.jpg` → `https://example.com/image.jpg` (unchanged)
- Empty/null/undefined → Returns default fallback image

### `getFirstImage(images, type)`

Extracts and normalizes the first image from an array or JSON string.

**Features:**
- Handles JSONB data from database (arrays or JSON strings)
- Robust type checking and error handling
- Automatic fallback to default images
- Uses `normalizeImageUrl()` internally

### `handleImageError(event, type)`

Provides consistent error handling for failed image loads.

**Features:**
- Sets fallback image on error
- Prevents infinite loops if fallback also fails
- Supports both product and category image types

## Usage Guide

### Displaying Product Images in Components

```tsx
import { getFirstImage, handleImageError } from "@/lib/imageUtils";

// In your component
<img 
  src={getFirstImage(product.images, 'product')} 
  alt={product.name}
  onError={(e) => handleImageError(e, 'product')}
/>
```

### Using with Image Optimization

```tsx
import { getFirstImage, handleImageError } from "@/lib/imageUtils";
import { getOptimizedImageUrl } from "@/lib/image-optimizer";

// First normalize, then optimize
const normalizedUrl = getFirstImage(product.images, 'product');
const optimizedUrl = getOptimizedImageUrl(normalizedUrl, { width: 400, height: 300 });

<img 
  src={optimizedUrl}
  alt={product.name}
  onError={(e) => handleImageError(e, 'product')}
/>
```

### Handling Image Uploads in Admin Panel

```tsx
import { normalizeImageUrl } from "@/lib/imageUtils";

// When saving images to database
const normalizedImages = selectedImages.map(img => normalizeImageUrl(img.url));
```

## Image URL Formats

### Supported Input Formats

| Input Format | Example | Output |
|--------------|---------|--------|
| Filename only | `door.jpg` | `/uploads/door.jpg` |
| Relative path (no slash) | `uploads/door.jpg` | `/uploads/door.jpg` |
| Relative path (with slash) | `/uploads/door.jpg` | `/uploads/door.jpg` |
| Root-relative (non-uploads) | `/media/door.jpg` | `/media/door.jpg` |
| Full URL | `https://cdn.example.com/door.jpg` | `https://cdn.example.com/door.jpg` |
| Empty/null | `null` | Default fallback image |

### Default Fallback Images

- **Products**: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800`
- **Categories**: `https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800`

## Best Practices

### Always Use Unified Functions

✅ **Correct:**
```tsx
<img src={getFirstImage(product.images, 'product')} />
```

❌ **Incorrect:**
```tsx
<img src={product.images?.[0] || 'fallback.jpg'} />
```

### Always Add Error Handlers

✅ **Correct:**
```tsx
<img 
  src={getFirstImage(product.images, 'product')}
  onError={(e) => handleImageError(e, 'product')}
/>
```

❌ **Incorrect:**
```tsx
<img src={getFirstImage(product.images, 'product')} />
```

### Normalize Before Saving

✅ **Correct:**
```tsx
const normalizedImages = images.map(img => normalizeImageUrl(img));
// Save normalizedImages to database
```

❌ **Incorrect:**
```tsx
// Save raw image URLs directly to database
```

### Use Optimization for External Images

✅ **Correct:**
```tsx
const normalizedUrl = getFirstImage(product.images, 'product');
const optimizedUrl = getOptimizedImageUrl(normalizedUrl, { width: 400 });
```

## Migration Guide

### Running the Database Migration

To fix existing inconsistent image paths in the database:

```bash
# Preview changes (dry run)
node fix-product-images.cjs --dry-run

# Apply changes
node fix-product-images.cjs
```

### Migration Features

- **Safe**: Includes dry-run mode to preview changes
- **Idempotent**: Can be run multiple times safely  
- **Comprehensive**: Handles all image path formats
- **Detailed logging**: Shows exactly what changes are made
- **Error handling**: Continues processing even if individual products fail

## Troubleshooting

### Common Issues

**Images not displaying:**
1. Check if image files exist in `/uploads` directory
2. Verify server is serving static files correctly
3. Check browser console for 404 errors
4. Ensure `getFirstImage()` is being used

**Default images showing instead of uploaded images:**
1. Check database - are image paths stored correctly?
2. Run the migration script to normalize paths
3. Verify image URLs are properly formatted

**Images failing to load:**
1. Ensure `handleImageError()` is added to all `<img>` tags
2. Check network tab for failed requests
3. Verify file permissions on `/uploads` directory

### Debugging

Enable debugging by checking browser console logs. The `getFirstImage()` function includes detailed logging to help identify issues.

## File Structure

```
client/src/lib/
├── imageUtils.ts          # Core image utilities
└── image-optimizer.ts     # External image optimization

server/
├── routes.ts             # File upload endpoints
├── fileStorage.ts        # File storage management
└── index.ts             # Static file serving

fix-product-images.cjs    # Database migration script
```

## API Endpoints

### File Upload
- `POST /api/admin/media/upload` - Upload single file
- `POST /api/admin/media/upload-multiple` - Upload multiple files

### Static File Serving
- `GET /uploads/*` - Serve uploaded files

## Dependencies

- **Frontend**: React, TypeScript
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with JSONB support
- **File Storage**: Local filesystem with Express static middleware

## Version History

- **v1.0**: Initial fragmented image handling
- **v2.0**: Unified image system with consistent URL normalization
- **v2.1**: Added database migration script and comprehensive documentation

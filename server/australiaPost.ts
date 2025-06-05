import { Request, Response } from "express";

// Use the provided API key from environment or fallback to the one you gave me
const AUSPOST_API_KEY = process.env.AUSPOST_API_KEY || "a992b572-c330-438b-bbdb-6fc40b1aa321";
const AUSPOST_BASE_URL = "https://digitalapi.auspost.com.au";

interface ShippingDimensions {
  weight: number; // in grams
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
}

interface BoxPricing {
  [key: string]: {
    price: number; // Box cost in AUD
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    name: string;
  };
}

// Australia Post box pricing (as of 2024)
const AUSPOST_BOX_PRICES: BoxPricing = {
  'Bx1': { price: 3.50, dimensions: { length: 22, width: 16, height: 7.7 }, name: 'Bx1 - 22×16×7.7cm (Small)' },
  'Bx2': { price: 4.25, dimensions: { length: 31, width: 22.5, height: 10.2 }, name: 'Bx2 - 31×22.5×10.2cm (Medium)' },
  'Bx3': { price: 5.75, dimensions: { length: 40, width: 20, height: 18 }, name: 'Bx3 - 40×20×18cm (Long)' },
  'Bx4': { price: 6.25, dimensions: { length: 43, width: 30.5, height: 14 }, name: 'Bx4 - 43×30.5×14cm (Wide)' },
  'Bx5': { price: 8.50, dimensions: { length: 40.5, width: 30, height: 25.5 }, name: 'Bx5 - 40.5×30×25.5cm (Large)' },
  'Bx6': { price: 2.75, dimensions: { length: 22, width: 14.5, height: 3.5 }, name: 'Bx6 - 22×14.5×3.5cm (Flat)' },
  'Bx7': { price: 1.95, dimensions: { length: 14.5, width: 12.7, height: 1 }, name: 'Bx7 - 14.5×12.7×1cm (Very Flat)' },
  'Bx8': { price: 4.95, dimensions: { length: 36.3, width: 21.2, height: 6.5 }, name: 'Bx8 - 36.3×21.2×6.5cm (ToughPak)' },
};

// Maximum dimensions for Australia Post parcels
const MAX_DIMENSIONS = {
  weight: 22000, // 22kg in grams
  length: 105,   // 105cm
  width: 105,    // 105cm
  height: 105,   // 105cm
  girth: 140     // 140cm (length + 2×width + 2×height)
};

interface PostageService {
  code: string;
  name: string;
  price: string;
  max_extra_cover?: number;
}

interface PostageResponse {
  services: {
    service: PostageService[];
  };
}

/**
 * Check if product dimensions exceed Australia Post limits
 */
export function isOversizedProduct(dimensions: ShippingDimensions): boolean {
  const girth = dimensions.length + (2 * dimensions.width) + (2 * dimensions.height);
  
  return (
    dimensions.weight > MAX_DIMENSIONS.weight ||
    dimensions.length > MAX_DIMENSIONS.length ||
    dimensions.width > MAX_DIMENSIONS.width ||
    dimensions.height > MAX_DIMENSIONS.height ||
    girth > MAX_DIMENSIONS.girth
  );
}

/**
 * Get box price by box size code
 */
export function getBoxPrice(boxSize: string): number {
  return AUSPOST_BOX_PRICES[boxSize]?.price || 0;
}

/**
 * Calculate GST (10% inclusive)
 */
export function calculateGST(amount: number): number {
  return amount * 0.1;
}

/**
 * Calculate total shipping cost including box price and postage
 * Returns an object with breakdown of costs
 */
export async function calculateTotalShippingCost(
  dimensions: ShippingDimensions,
  boxSize: string,
  toPostcode: string = "3000"
): Promise<{
  postage: number;
  boxPrice: number;
  subtotal: number;
  gst: number;
  total: number;
  isOversized: boolean;
  oversizedMessage?: string;
}> {
  const boxPrice = getBoxPrice(boxSize);
  const oversized = isOversizedProduct(dimensions);
  
  if (oversized) {
    return {
      postage: 0,
      boxPrice: 0,
      subtotal: 0,
      gst: 0,
      total: 0,
      isOversized: true,
      oversizedMessage: "This product exceeds Australia Post size limits. Please call (03) 5221 8999 for a custom shipping quote."
    };
  }
  
  try {
    const postage = await calculateShippingCost(dimensions, toPostcode);
    const subtotal = postage + boxPrice;
    const gst = calculateGST(subtotal);
    const total = subtotal + gst;
    
    return {
      postage,
      boxPrice,
      subtotal,
      gst,
      total,
      isOversized: false
    };
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    throw new Error("Unable to calculate shipping cost");
  }
}

/**
 * Calculate shipping cost using Australia Post API
 * Uses standard domestic postage from Melbourne (3000) to customer location
 */
export async function calculateShippingCost(
  dimensions: ShippingDimensions,
  toPostcode: string = "3000" // Default to Melbourne for general pricing
): Promise<number> {
  try {
    // Convert weight from grams to kg for Australia Post API
    const weightInKg = dimensions.weight / 1000;
    
    // Build query parameters
    const params = new URLSearchParams({
      from_postcode: "3000", // Melbourne - your business location
      to_postcode: toPostcode,
      length: dimensions.length.toString(),
      width: dimensions.width.toString(),
      height: dimensions.height.toString(),
      weight: weightInKg.toString()
    });

    const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/service.json?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Australia Post API error: ${response.status} ${response.statusText}`);
    }

    const data: PostageResponse = await response.json();
    
    // Find the standard parcel post service (cheapest reliable option)
    const standardService = data.services.service.find(
      service => service.code === "AUS_PARCEL_REGULAR"
    );
    
    if (standardService) {
      return parseFloat(standardService.price);
    }
    
    // Fallback to cheapest regular service if standard not found
    const regularServices = data.services.service.filter(
      service => service.code.includes("REGULAR")
    );
    
    if (regularServices.length > 0) {
      // Sort by price and return cheapest
      regularServices.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      return parseFloat(regularServices[0].price);
    }
    
    // Fallback to cheapest available service
    if (data.services.service.length > 0) {
      const sortedServices = data.services.service.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      return parseFloat(sortedServices[0].price);
    }
    
    // If no services available, return default shipping cost
    return 15.00;
    
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    // Return default shipping cost on error
    return 15.00;
  }
}

/**
 * Get available Australia Post standard box sizes
 */
export async function getAustraliaPostBoxes(req: Request, res: Response) {
  try {
    const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/size.json`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Australia Post API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Australia Post boxes:", error);
    res.status(500).json({
      error: "Failed to fetch available box sizes"
    });
  }
}

/**
 * Validate that all required shipping dimensions are provided
 */
export function validateShippingDimensions(product: any): {
  isValid: boolean;
  missingFields: string[];
} {
  const requiredFields = ['weight', 'length', 'width', 'height'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!product[field] || product[field] <= 0) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Get available Australia Post services for given dimensions
 */
export async function getAvailableServices(req: Request, res: Response) {
  try {
    const { weight, length, width, height, toPostcode = "3000" } = req.query;
    
    if (!weight || !length || !width || !height) {
      return res.status(400).json({
        error: "Missing required parameters: weight, length, width, height"
      });
    }
    
    const dimensions: ShippingDimensions = {
      weight: parseFloat(weight as string),
      length: parseFloat(length as string),
      width: parseFloat(width as string),
      height: parseFloat(height as string)
    };
    
    const weightInKg = dimensions.weight / 1000;
    
    const params = new URLSearchParams({
      from_postcode: "3000",
      to_postcode: toPostcode as string,
      length: dimensions.length.toString(),
      width: dimensions.width.toString(),
      height: dimensions.height.toString(),
      weight: weightInKg.toString()
    });

    const url = `${AUSPOST_BASE_URL}/postage/parcel/domestic/service.json?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AUTH-KEY': AUSPOST_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Australia Post API error: ${response.statusText}`
      });
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error("Error fetching Australia Post services:", error);
    res.status(500).json({ error: "Failed to fetch shipping services" });
  }
}
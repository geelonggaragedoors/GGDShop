import { Request, Response } from "express";

const AUSPOST_API_KEY = "a992b572-c330-438b-bbdb-6fc40b1aa321";
const AUSPOST_BASE_URL = "https://digitalapi.auspost.com.au";

interface ShippingDimensions {
  weight: number; // in grams
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
}

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
    
    // Fallback to first available service if standard not found
    if (data.services.service.length > 0) {
      return parseFloat(data.services.service[0].price);
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
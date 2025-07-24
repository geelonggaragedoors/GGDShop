// Australia Post shipping box sizes and pricing
export interface ShippingBox {
  id: string;
  name: string;
  dimensions: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  maxWeight: number; // kg
  parcelPostPrice: number; // AUD
  expressPostPrice: number; // AUD
  type: 'satchel' | 'box';
}

export const AUSTRALIA_POST_BOXES: ShippingBox[] = [
  // Prepaid Satchels (flat rate up to 5kg)
  {
    id: 'satchel-small',
    name: 'Small Satchel',
    dimensions: { length: 35.5, width: 22.5, height: 2 },
    maxWeight: 5,
    parcelPostPrice: 11.30,
    expressPostPrice: 12.95,
    type: 'satchel'
  },
  {
    id: 'satchel-medium',
    name: 'Medium Satchel', 
    dimensions: { length: 39, width: 27, height: 2 },
    maxWeight: 5,
    parcelPostPrice: 15.30,
    expressPostPrice: 16.50,
    type: 'satchel'
  },
  {
    id: 'satchel-large',
    name: 'Large Satchel',
    dimensions: { length: 40.5, width: 31.5, height: 2 },
    maxWeight: 5,
    parcelPostPrice: 19.35,
    expressPostPrice: 21.50,
    type: 'satchel'
  },
  {
    id: 'satchel-extra-large',
    name: 'Extra Large Satchel',
    dimensions: { length: 51, width: 44, height: 2 },
    maxWeight: 5,
    parcelPostPrice: 23.35,
    expressPostPrice: 27.50,
    type: 'satchel'
  },
  // Common box sizes (weight-based pricing)
  {
    id: 'box-small',
    name: 'Small Box',
    dimensions: { length: 20, width: 15, height: 10 },
    maxWeight: 22,
    parcelPostPrice: 0, // Calculate by weight
    expressPostPrice: 0, // Calculate by weight
    type: 'box'
  },
  {
    id: 'box-medium',
    name: 'Medium Box',
    dimensions: { length: 30, width: 25, height: 15 },
    maxWeight: 22,
    parcelPostPrice: 0, // Calculate by weight
    expressPostPrice: 0, // Calculate by weight
    type: 'box'
  },
  {
    id: 'box-large',
    name: 'Large Box',
    dimensions: { length: 40, width: 30, height: 20 },
    maxWeight: 22,
    parcelPostPrice: 0, // Calculate by weight
    expressPostPrice: 0, // Calculate by weight
    type: 'box'
  }
];

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number; // kg
}

export function findSuitableBoxes(productDimensions: ProductDimensions): ShippingBox[] {
  return AUSTRALIA_POST_BOXES.filter(box => {
    const fits = 
      productDimensions.length <= box.dimensions.length &&
      productDimensions.width <= box.dimensions.width &&
      productDimensions.height <= box.dimensions.height &&
      productDimensions.weight <= box.maxWeight;
    
    return fits;
  }).sort((a, b) => {
    // Sort by volume (smallest suitable box first)
    const volumeA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
    const volumeB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
    return volumeA - volumeB;
  });
}

export function formatDimensions(box: ShippingBox): string {
  return `${box.dimensions.length}cm × ${box.dimensions.width}cm × ${box.dimensions.height}cm`;
}

export function getShippingPrice(box: ShippingBox, weight: number, expressPost: boolean = false): number {
  if (box.type === 'satchel') {
    return expressPost ? box.expressPostPrice : box.parcelPostPrice;
  }
  
  // For boxes, you'll need to calculate by weight using Australia Post API
  // This is a placeholder - implement actual weight-based calculation
  const baseRate = expressPost ? 12 : 8;
  const weightRate = expressPost ? 5 : 3;
  return baseRate + (weight * weightRate);
}
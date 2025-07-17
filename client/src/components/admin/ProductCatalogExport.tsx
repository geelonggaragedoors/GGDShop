import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  price: number | string;
  sku?: string;
  images?: string[];
  categoryId: string;
  brandId: string;
  stockQuantity: number;
  freePostage: boolean;
  isFeatured: boolean;
  isActive?: boolean;
}

// Helper function to load image and return base64 data
const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx?.drawImage(img, 0, 0);
      
      // Get base64 data
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataURL);
    };
    
    img.onerror = () => {
      console.error('Failed to load image:', url);
      resolve(null);
    };
    
    img.src = url;
  });
};

export default function ProductCatalogExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: productsData } = useQuery({
    queryKey: ['/api/admin/products'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: brands } = useQuery({
    queryKey: ['/api/brands'],
  });

  const generatePDF = async () => {
    if (!productsData || !categories || !brands) {
      toast({
        title: "Error",
        description: "Product data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      toast({
        title: "Generating PDF...",
        description: "This may take a moment to load all product images",
      });

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text("Geelong Garage Doors", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;

      pdf.setFontSize(16);
      pdf.setTextColor(102, 102, 102); // Gray color
      pdf.text("Product Catalog & Price List", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(136, 136, 136); // Light gray
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Add line separator
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Get all products in order (not categorized)
      const allProducts = productsData.products.filter((p: Product) => p.isActive !== false);
      
      // Process products in groups of 4 (2x2 grid per page)
      for (let i = 0; i < allProducts.length; i += 4) {
        // Add new page if not the first group
        if (i > 0) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Get up to 4 products for this page
        const pageProducts = allProducts.slice(i, i + 4);
        
        // Layout: 2 products per row, 2 rows per page
        const productWidth = (pageWidth - 3 * margin) / 2; // Width for each product
        const productHeight = (pageHeight - 3 * margin) / 2; // Height for each product
        const imageWidth = productWidth - 10; // Leave some padding
        const imageHeight = productHeight * 0.6; // 60% of product height for image
        
        for (let j = 0; j < pageProducts.length; j++) {
          const product = pageProducts[j];
          const brand = brands?.find((b: any) => b.id === product.brandId);
          const brandName = brand?.name || 'Unknown Brand';
          const category = categories?.find((c: any) => c.id === product.categoryId);
          const categoryName = category?.name || 'Uncategorized';
          
          // Calculate position (2x2 grid)
          const col = j % 2;
          const row = Math.floor(j / 2);
          const productX = margin + col * (productWidth + (margin/2));
          const productY = yPosition + row * (productHeight + (margin/2));
          
          // Add product image area
          pdf.setDrawColor(200, 200, 200);
          pdf.setFillColor(245, 245, 245);
          pdf.rect(productX, productY, imageWidth, imageHeight, 'FD');
          
          // Load and display product image
          const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
          
          if (hasImages) {
            const firstImagePath = product.images[0];
            const imageUrl = `${window.location.origin}${firstImagePath}`;
            const imageBase64 = await loadImageAsBase64(imageUrl);
            
            if (imageBase64) {
              const img = new Image();
              img.src = imageBase64;
              
              await new Promise((resolve) => {
                img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  let displayWidth = imageWidth;
                  let displayHeight = imageHeight;
                  
                  if (aspectRatio > 1) {
                    displayHeight = imageWidth / aspectRatio;
                    if (displayHeight > imageHeight) {
                      displayHeight = imageHeight;
                      displayWidth = imageHeight * aspectRatio;
                    }
                  } else {
                    displayWidth = imageHeight * aspectRatio;
                    if (displayWidth > imageWidth) {
                      displayWidth = imageWidth;
                      displayHeight = imageWidth / aspectRatio;
                    }
                  }
                  
                  const xOffset = (imageWidth - displayWidth) / 2;
                  const yOffset = (imageHeight - displayHeight) / 2;
                  
                  pdf.addImage(imageBase64, 'JPEG', productX + xOffset, productY + yOffset, displayWidth, displayHeight);
                  
                  if (product.images.length > 1) {
                    pdf.setFontSize(7);
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFillColor(37, 99, 235);
                    pdf.rect(productX + imageWidth - 15, productY + 2, 12, 6, 'F');
                    pdf.text(`+${product.images.length - 1}`, productX + imageWidth - 9, productY + 6, { align: 'center' });
                  }
                  
                  resolve(true);
                };
              });
            } else {
              pdf.setFontSize(8);
              pdf.setTextColor(220, 38, 38);
              pdf.text('IMAGE ERROR', productX + imageWidth/2, productY + imageHeight/2, { align: 'center' });
            }
          } else {
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('NO IMAGE', productX + imageWidth/2, productY + imageHeight/2, { align: 'center' });
          }
          
          // Product info starts below image
          let infoY = productY + imageHeight + 8;
          
          // Add checkbox with "checked" text
          pdf.setDrawColor(0, 0, 0);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(productX, infoY, 4, 4, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(102, 102, 102);
          pdf.text('checked', productX + 6, infoY + 3);
          infoY += 8;
          
          // Add product name
          pdf.setFontSize(11);
          pdf.setTextColor(51, 51, 51);
          const nameLines = pdf.splitTextToSize(product.name, productWidth - 5);
          pdf.text(nameLines[0], productX, infoY);
          if (nameLines.length > 1) {
            pdf.text(nameLines[1], productX, infoY + 4);
            infoY += 4;
          }
          infoY += 6;
          
          // Add category
          pdf.setFontSize(9);
          pdf.setTextColor(37, 99, 235);
          pdf.text(`Category: ${categoryName}`, productX, infoY);
          infoY += 5;
          
          // Add brand
          pdf.setFontSize(9);
          pdf.setTextColor(102, 102, 102);
          pdf.text(brandName, productX, infoY);
          infoY += 5;
          
          // Add price with stars
          pdf.setFontSize(10);
          pdf.setTextColor(51, 51, 51);
          pdf.text('★★★★★', productX, infoY);
          infoY += 5;
          
          pdf.setFontSize(12);
          pdf.setTextColor(37, 99, 235);
          const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
          pdf.text(`$${price.toFixed(2)}`, productX, infoY);
        }
      }

      // Save PDF
      const fileName = `geelong-garage-doors-catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Success!",
        description: "PDF catalog generated successfully",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Product Catalog Export</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        Generate a PDF catalog with product images arranged in a 2x2 grid layout (4 products per page).
      </p>
      
      <Button
        onClick={generatePDF}
        disabled={isGenerating || !productsData}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Generate PDF Catalog
          </>
        )}
      </Button>
    </div>
  );
}
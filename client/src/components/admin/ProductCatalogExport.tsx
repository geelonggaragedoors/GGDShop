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
  description?: string;
}

// Helper function to load image and return base64 data
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    // Use fetch for same-origin images to avoid CORS issues
    const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
    
    if (isSameOrigin) {
      // Fetch the image as a blob
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch image:', url, response.status);
        return null;
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('Failed to read blob:', url);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // For external URLs, use Image element with crossOrigin
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error('Failed to get canvas context');
              resolve(null);
              return;
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } catch (error) {
            console.error('Error converting image to base64:', error);
            resolve(null);
          }
        };
        
        img.onerror = (error) => {
          console.error('Failed to load image:', url, error);
          resolve(null);
        };
        
        img.src = url;
      });
    }
  } catch (error) {
    console.error('Error loading image:', url, error);
    return null;
  }
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
      const margin = 10;
      let pageNumber = 1;

      // Helper function to add page numbers
      const addPageNumber = () => {
        pdf.setFontSize(10);
        pdf.setTextColor(136, 136, 136);
        pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 5, { align: "right" });
        pageNumber++;
      };

      // COVER PAGE
      let yPosition = 50;
      
      // Add a simple logo placeholder (blue rectangle with text)
      pdf.setFillColor(37, 99, 235);
      pdf.rect(pageWidth / 2 - 30, yPosition, 60, 20, 'F');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text("GGD", pageWidth / 2, yPosition + 13, { align: "center" });
      yPosition += 40;

      // Main title
      pdf.setFontSize(28);
      pdf.setTextColor(37, 99, 235);
      pdf.text("Geelong Garage Door", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      pdf.text("Product Catalog", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 30;

      // Subtitle
      pdf.setFontSize(16);
      pdf.setTextColor(102, 102, 102);
      pdf.text("Complete Product Range & Price List", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Date
      pdf.setFontSize(12);
      pdf.setTextColor(136, 136, 136);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" });

      addPageNumber();

      // Organize products by category
      const allProducts = (productsData as any).products.filter((p: any) => p.isActive !== false);
      const productsByCategory = new Map();
      
      // Group products by category
      allProducts.forEach((product: any) => {
        const category = (categories as any)?.find((c: any) => c.id === product.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        
        if (!productsByCategory.has(categoryName)) {
          productsByCategory.set(categoryName, []);
        }
        productsByCategory.get(categoryName).push(product);
      });

      // CATEGORY INDEX PAGE
      pdf.addPage();
      yPosition = margin + 20;
      
      pdf.setFontSize(24);
      pdf.setTextColor(37, 99, 235);
      pdf.text("Category Index", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Calculate page numbers for each category
      let currentPage = 3; // Starting after cover and index
      const categoryPages = new Map();
      
      for (const [categoryName, products] of Array.from(productsByCategory)) {
        categoryPages.set(categoryName, currentPage);
        const productsPerPage = 4;
        const pagesNeeded = Math.ceil(products.length / productsPerPage);
        currentPage += pagesNeeded;
      }

      // Display category index
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      
      for (const [categoryName, products] of Array.from(productsByCategory)) {
        const startPage = categoryPages.get(categoryName);
        const productsPerPage = 4;
        const pagesNeeded = Math.ceil(products.length / productsPerPage);
        const endPage = startPage + pagesNeeded - 1;
        
        const pageRange = pagesNeeded === 1 ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`;
        
        // Category name and dots
        const categoryText = `${categoryName} (${products.length} products)`;
        const pageText = pageRange;
        const availableWidth = pageWidth - 2 * margin - pdf.getTextWidth(pageText);
        const categoryWidth = pdf.getTextWidth(categoryText);
        const dotsWidth = availableWidth - categoryWidth - 5;
        const dotCount = Math.floor(dotsWidth / pdf.getTextWidth('.'));
        const dots = '.'.repeat(Math.max(0, dotCount));
        
        pdf.text(categoryText, margin, yPosition);
        pdf.text(dots, margin + categoryWidth + 2, yPosition);
        pdf.text(pageText, pageWidth - margin, yPosition, { align: "right" });
        yPosition += 8;
      }

      addPageNumber();

      // PRODUCT PAGES BY CATEGORY
      for (const [categoryName, products] of Array.from(productsByCategory)) {
        pdf.addPage();
        yPosition = margin;

        // Category header
        pdf.setFontSize(20);
        pdf.setTextColor(37, 99, 235);
        pdf.text(categoryName, pageWidth / 2, yPosition, { align: "center" });
        yPosition += 15;

        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;

        let productsProcessed = 0;
        let isFirstPageOfCategory = true;

        while (productsProcessed < products.length) {
          if (!isFirstPageOfCategory) {
            pdf.addPage();
            yPosition = margin + 10;
          }
          isFirstPageOfCategory = false;

          const productsPerPage = 4;
          const pageProducts = products.slice(productsProcessed, productsProcessed + productsPerPage);
          productsProcessed += pageProducts.length;

          // Layout: 2 products per row, 2 rows per page
          const productWidth = (pageWidth - 3 * margin) / 2;
          const productHeight = (pageHeight - yPosition - 30) / 2; // Leave space for page number
          const imageWidth = productWidth - 2;
          const imageHeight = productHeight * 0.5;

          for (let j = 0; j < pageProducts.length; j++) {
            const product = pageProducts[j];
            const brand = (brands as any)?.find((b: any) => b.id === product.brandId);
            const brandName = brand?.name || 'Unknown Brand';

            // Calculate position (2 products per row)
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
              
              // Construct proper image URL
              let imageUrl: string;
              if (firstImagePath.startsWith('http://') || firstImagePath.startsWith('https://')) {
                // Already absolute URL
                imageUrl = firstImagePath;
              } else if (firstImagePath.startsWith('/')) {
                // Relative path from root
                imageUrl = `${window.location.origin}${firstImagePath}`;
              } else {
                // Relative path without leading slash
                imageUrl = `${window.location.origin}/${firstImagePath}`;
              }
              
              console.log(`Loading image: ${imageUrl}`);
              const imageBase64 = await loadImageAsBase64(imageUrl);

              if (imageBase64) {
                console.log(`Successfully loaded image: ${imageUrl}`);
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
            let infoY = productY + imageHeight + 3;

            // Add checkbox
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
            const nameLines = pdf.splitTextToSize(product.name, productWidth - 2);
            pdf.text(nameLines[0], productX, infoY);
            if (nameLines.length > 1) {
              pdf.text(nameLines[1], productX, infoY + 4);
              infoY += 4;
            }
            infoY += 6;

            // Add brand
            pdf.setFontSize(9);
            pdf.setTextColor(102, 102, 102);
            pdf.text(brandName, productX, infoY);
            infoY += 6;

            // Add description if available
            if (product.description && product.description.trim()) {
              pdf.setFontSize(9);
              pdf.setTextColor(102, 102, 102);
              const cleanDescription = product.description
                .replace(/\\n/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/\. /g, '.  ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
              const descriptionLines = pdf.splitTextToSize(cleanDescription, productWidth - 2);
              const maxLines = 6;
              for (let i = 0; i < Math.min(descriptionLines.length, maxLines); i++) {
                pdf.text(descriptionLines[i], productX, infoY);
                infoY += 4;
              }
              infoY += 3;
            }

            // Add price
            pdf.setFontSize(12);
            pdf.setTextColor(37, 99, 235);
            const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
            pdf.text(`$${price.toFixed(2)}`, productX, infoY);
          }

          addPageNumber();
        }
      }

      // Save PDF
      const fileName = `geelong-garage-doors-catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Success!",
        description: "PDF catalog generated successfully with page numbers and category index",
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
        Generate a professional PDF catalog with cover page, category index, page numbers, and products organized by category (4 products per page).
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
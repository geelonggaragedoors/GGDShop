import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  brandId: string;
  categoryId: string;
  images: string[];
  specifications: any;
  isActive: boolean;
  isFeatured: boolean;
  freePostage: boolean;
}

export default function ProductCatalogExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["/api/admin/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const generatePDF = async () => {
    if (!productsData?.products?.length) {
      toast({
        title: "No products found",
        description: "There are no products to export.",
        variant: "destructive",
      });
      return;
    }

    if (!categories || !brands) {
      toast({
        title: "Loading data",
        description: "Please wait for product data to load completely.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create PDF directly without html2canvas
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * lineHeight;
      };

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

      // Process products by category
      const activeProducts = productsData.products.filter(p => p.isActive);
      const categorizedProducts = activeProducts.reduce((acc, product) => {
        const category = categories?.find(c => c.id === product.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(product);
        return acc;
      }, {} as Record<string, Product[]>);

      // Generate content for each category
      for (const [categoryName, products] of Object.entries(categorizedProducts)) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        // Category header
        pdf.setFontSize(18);
        pdf.setTextColor(37, 99, 235); // Blue color
        pdf.text(categoryName, margin, yPosition);
        yPosition += 8;

        // Category underline
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Products in category
        for (const product of products) {
          // Check if we need a new page (increased threshold for images)
          if (yPosition > pageHeight - 70) {
            pdf.addPage();
            yPosition = margin;
          }

          const brand = brands?.find(b => b.id === product.brandId);
          const brandName = brand?.name || 'Unknown Brand';

          // Define layout areas
          const imageWidth = 30; // Width for product image
          const imageHeight = 25; // Height for product image
          const textStartX = margin + imageWidth + 5; // Start text after image + margin
          const textMaxWidth = pageWidth - textStartX - margin - 50; // Leave space for price
          const productStartY = yPosition;

          // Add product image placeholder
          pdf.setDrawColor(200, 200, 200);
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, yPosition, imageWidth, imageHeight, 'FD');
          
          // Add image indicator
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          
          // Check if product has images
          const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
          
          if (hasImages) {
            // Add a small icon or indicator for images
            pdf.setFontSize(10);
            pdf.setTextColor(37, 99, 235); // Blue color
            pdf.text('📷', margin + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
            
            // Add image count
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`${product.images.length} image${product.images.length > 1 ? 's' : ''}`, margin + imageWidth/2, yPosition + imageHeight/2 + 5, { align: 'center' });
          } else {
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('NO IMAGE', margin + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
          }

          // Product name and price - with proper wrapping to avoid overlap
          pdf.setFontSize(14);
          pdf.setTextColor(31, 41, 55); // Dark gray
          
          // Calculate available width for product name (leaving space for price)
          const priceText = `$${product.price.toLocaleString()}`;
          pdf.setFontSize(14);
          pdf.setTextColor(37, 99, 235);
          const priceWidth = pdf.getTextWidth(priceText);
          const nameMaxWidth = pageWidth - textStartX - margin - priceWidth - 10; // 10mm buffer
          
          pdf.setFontSize(14);
          pdf.setTextColor(31, 41, 55); // Dark gray
          const nameLines = pdf.splitTextToSize(product.name, nameMaxWidth);
          pdf.text(nameLines, textStartX, yPosition);
          
          // Add price on the first line
          pdf.setFontSize(14);
          pdf.setTextColor(37, 99, 235); // Blue color
          pdf.text(priceText, pageWidth - margin, yPosition, { align: "right" });
          
          // Calculate y position based on number of lines in product name
          const nameHeight = nameLines.length * 5; // 5 is line height for size 14
          yPosition += Math.max(nameHeight, 8); // Use at least 8mm for single line

          // Product details
          pdf.setFontSize(10);
          pdf.setTextColor(102, 102, 102); // Gray color
          pdf.text(`SKU: ${product.sku || 'N/A'}`, textStartX, yPosition);
          
          // Calculate positions for other details
          const skuWidth = pdf.getTextWidth(`SKU: ${product.sku || 'N/A'}`);
          const brandX = textStartX + skuWidth + 15;
          pdf.text(`Brand: ${brandName}`, brandX, yPosition);
          
          const brandWidth = pdf.getTextWidth(`Brand: ${brandName}`);
          const stockX = brandX + brandWidth + 15;
          if (stockX < pageWidth - margin - 80) { // Only add if there's space
            pdf.text(`Stock: ${product.stockQuantity}`, stockX, yPosition);
          }
          
          if (product.freePostage) {
            pdf.setTextColor(22, 163, 74); // Green color
            pdf.text('✓ Free Postage', pageWidth - margin - 30, yPosition);
          }
          yPosition += 6;

          // Description
          if (product.description) {
            pdf.setFontSize(9);
            pdf.setTextColor(102, 102, 102);
            const descriptionHeight = addText(product.description, textStartX, yPosition, pageWidth - textStartX - margin, 9);
            yPosition += descriptionHeight;
          }

          // Specifications
          if (product.specifications && Object.keys(product.specifications).length > 0) {
            pdf.setFontSize(9);
            pdf.setTextColor(55, 65, 81); // Dark gray
            pdf.text('Specifications:', textStartX, yPosition);
            yPosition += 5;

            let specText = '';
            for (const [key, value] of Object.entries(product.specifications)) {
              specText += `${key}: ${value}  `;
            }
            
            pdf.setFontSize(8);
            pdf.setTextColor(102, 102, 102);
            const specHeight = addText(specText, textStartX, yPosition, pageWidth - textStartX - margin, 8);
            yPosition += specHeight;
          }

          // Ensure minimum space is used for image height
          const contentHeight = yPosition - productStartY;
          if (contentHeight < imageHeight) {
            yPosition = productStartY + imageHeight;
          }

          yPosition += 10; // Space between products
        }

        yPosition += 10; // Space between categories
      }

      // Add footer on last page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Footer separator
      pdf.setDrawColor(229, 231, 235);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Footer content
      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text("Geelong Garage Doors", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.text("Email: info@geelonggaragedoors.com | Web: geelonggaragedoors.com", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(136, 136, 136);
      pdf.text("Prices are subject to change. Contact us for current availability and pricing.", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5;

      pdf.text(`Document generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" });

      // Save the PDF
      const fileName = `Geelong-Garage-Doors-Catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Generated Successfully",
        description: `Product catalog exported as ${fileName}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating || !productsData?.products?.length}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Export Product Catalog
        </>
      )}
    </Button>
  );
}
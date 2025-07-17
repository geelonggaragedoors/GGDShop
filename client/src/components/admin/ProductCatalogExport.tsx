import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
      // Create a temporary container for the PDF content
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.top = "-10000px";
      tempContainer.style.left = "-10000px";
      tempContainer.style.width = "210mm"; // A4 width
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "20px";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      document.body.appendChild(tempContainer);

      // Generate HTML content for PDF
      const htmlContent = generateCatalogHTML(productsData.products, categories, brands);
      tempContainer.innerHTML = htmlContent;

      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // If content is too long, add more pages
      const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);
      if (totalPages > 1) {
        for (let i = 1; i < totalPages; i++) {
          pdf.addPage();
          const yOffset = -pdfHeight * i;
          pdf.addImage(imgData, "PNG", imgX, yOffset, imgWidth * ratio, imgHeight * ratio);
        }
      }

      // Save the PDF
      const fileName = `Geelong-Garage-Doors-Catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Clean up
      document.body.removeChild(tempContainer);

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

  const generateCatalogHTML = (products: Product[], categories: any[], brands: any[]) => {
    const activeProducts = products.filter(p => p.isActive);
    const categorizedProducts = activeProducts.reduce((acc, product) => {
      const category = categories?.find(c => c.id === product.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Geelong Garage Doors</h1>
          <p style="color: #666; font-size: 16px; margin: 10px 0;">Product Catalog & Price List</p>
          <p style="color: #888; font-size: 14px; margin: 0;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Products by Category -->
        ${Object.entries(categorizedProducts).map(([category, products]) => `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              ${category}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              ${products.map(product => {
                const brand = brands?.find(b => b.id === product.brandId);
                const brandName = brand?.name || 'Unknown Brand';
                
                return `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #fafafa;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="color: #1f2937; font-size: 16px; margin: 0; font-weight: bold;">${product.name}</h3>
                    <span style="color: #2563eb; font-size: 18px; font-weight: bold;">$${product.price.toLocaleString()}</span>
                  </div>
                  
                  <div style="margin-bottom: 10px;">
                    <p style="color: #666; font-size: 12px; margin: 2px 0;"><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                    <p style="color: #666; font-size: 12px; margin: 2px 0;"><strong>Brand:</strong> ${brandName}</p>
                    <p style="color: #666; font-size: 12px; margin: 2px 0;"><strong>Stock:</strong> ${product.stockQuantity}</p>
                    ${product.freePostage ? '<p style="color: #16a34a; font-size: 12px; margin: 2px 0; font-weight: bold;">✓ Free Postage</p>' : ''}
                  </div>
                  
                  ${product.description ? `
                    <p style="color: #666; font-size: 13px; margin-bottom: 10px;">${product.description}</p>
                  ` : ''}
                  
                  ${product.specifications && Object.keys(product.specifications).length > 0 ? `
                    <div style="margin-top: 10px;">
                      <p style="color: #374151; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Specifications:</p>
                      <div style="font-size: 12px; color: #666;">
                        ${Object.entries(product.specifications).map(([key, value]) => `
                          <span style="display: inline-block; margin-right: 15px; margin-bottom: 3px;">
                            <strong>${key}:</strong> ${value}
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 5px 0;">
            <strong>Geelong Garage Doors</strong> | 
            Email: info@geelonggaragedoors.com | 
            Web: geelonggaragedoors.com
          </p>
          <p style="color: #888; font-size: 12px; margin: 10px 0;">
            Prices are subject to change. Contact us for current availability and pricing.
          </p>
          <p style="color: #888; font-size: 12px; margin: 0;">
            Document generated on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;
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
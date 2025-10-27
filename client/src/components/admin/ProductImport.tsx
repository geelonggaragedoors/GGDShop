import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResults {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  totalRecords?: number;
}

export function ProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await fetch('/api/admin/import/woocommerce', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status}`);
      }

      const data: ImportResults = await response.json();
      setResults(data);

      if (data.success) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${data.imported} products`,
        });
      } else {
        toast({
          title: "Import failed",
          description: "Please check the results below",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResults(null);
    // Reset file input
    const fileInput = document.getElementById('csv-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Products from WooCommerce
        </CardTitle>
        <CardDescription>
          Upload a CSV export from WooCommerce to import products, categories, and images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <Button variant="outline" onClick={resetImport} size="sm">
                Clear
              </Button>
            )}
          </div>
          
          {file && (
            <div className="text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Import Button */}
        <Button 
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full"
        >
          {importing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Products
            </>
          )}
        </Button>

        {/* Progress (when importing) */}
        {importing && (
          <div className="space-y-2">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              Processing products in batches (50 at a time)...
            </p>
            <p className="text-xs text-gray-500 text-center">
              This may take several minutes for large imports. Please wait...
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {results.totalRecords && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Processed {results.totalRecords} total records from CSV file
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600">{results.imported}</div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-semibold">Import Errors:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {results.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {results.errors.length > 5 && (
                        <li>... and {results.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {results.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import completed successfully! {results.imported} products have been added to your store.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-semibold">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Export your products from WooCommerce as CSV</li>
            <li>Products are processed in batches of 50 for reliability</li>
            <li>The import will automatically create categories and brands</li>
            <li>Product images will be downloaded from the URLs in the CSV</li>
            <li>Duplicate products (same name) will be skipped</li>
            <li>All prices, descriptions, and stock levels will be imported</li>
            <li>Large imports may take several minutes - please be patient</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
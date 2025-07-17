import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchDropdownProps {
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  isMobile?: boolean;
}

export default function SearchDropdown({ 
  className = "", 
  onSearch, 
  placeholder = "Search products...",
  autoFocus = false,
  isMobile = false
}: SearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions with debouncing
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/products/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.products || [];
    },
    enabled: searchQuery.length >= 2,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product: any) => {
    setShowSuggestions(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get first product image
  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
          autoFocus={autoFocus}
        />
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className={`absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 max-h-96 overflow-y-auto ${isMobile ? 'max-h-80' : ''}`}>
          {isLoading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((product: any) => {
                const image = getProductImage(product);
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestionClick(product)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-semibold text-primary">
                            ${parseFloat(product.price || 0).toFixed(2)}
                          </span>
                          {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price || 0) && (
                            <span className="text-xs text-gray-500 line-through">
                              ${parseFloat(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.category && (
                          <p className="text-xs text-gray-500 mt-1">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {/* View All Results */}
              <div className="border-t border-gray-100 mt-2">
                <button
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="w-full px-4 py-3 text-sm text-primary hover:bg-gray-50 transition-colors text-left"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No products found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
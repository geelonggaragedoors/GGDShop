import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface AddressComponents {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
}

// Declare the custom HTML element for the new PlaceAutocompleteElement
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
  
  interface Window {
    googleMapsScriptLoading?: boolean;
    [key: string]: any;
  }
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    formatted_address: string;
    components: AddressComponents;
  }) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  id?: string;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Start typing your address...",
  defaultValue = "",
  className = "",
  id = "address-autocomplete"
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteElementRef = useRef<any>(null);

  useEffect(() => {
    const loadGooglePlacesScript = async () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        return;
      }

      // Check if script is already loading/loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript || window.googleMapsScriptLoading) {
        // Script already exists or is loading, wait for it to load
        const checkGoogleLoaded = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogleLoaded);
            initializeAutocomplete();
          }
        }, 100);
        
        // Clear interval after 10 seconds to prevent infinite waiting
        setTimeout(() => clearInterval(checkGoogleLoaded), 10000);
        return;
      }

      try {
        // Set flag to prevent duplicate loading
        window.googleMapsScriptLoading = true;
        
        // Fetch API key from backend
        const response = await fetch('/api/google-places-key');
        const data = await response.json();
        
        // Create unique callback name to avoid conflicts
        const callbackName = `initGooglePlaces_${Date.now()}`;
        
        // Set up callback function
        window[callbackName] = () => {
          console.log('Google Places API loaded successfully');
          window.googleMapsScriptLoading = false;
          initializeAutocomplete();
          // Clean up callback
          delete window[callbackName];
        };
        
        // Load Google Maps JavaScript API with callback
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-script'; // Add ID to prevent duplicates
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          window.googleMapsScriptLoading = false;
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error('Failed to load Google Places API key:', err);
        window.googleMapsScriptLoading = false;
      }
    };

    const initializeAutocomplete = () => {
      console.log('Initializing autocomplete...');
      console.log('Input ref:', inputRef.current);
      console.log('Google maps loaded:', !!window.google);
      console.log('Places loaded:', !!window.google?.maps?.places);
      
      if (!inputRef.current) {
        console.error('Input ref not available');
        return;
      }
      
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps API not loaded');
        return;
      }

      try {
        // Use the current stable Autocomplete implementation
        // This will continue to work even after the new PlaceAutocompleteElement becomes available
        autocompleteElementRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'formatted_address', 'geometry'],
          componentRestrictions: { country: 'AU' } // Restrict to Australia
        });

        autocompleteElementRef.current.addListener('place_changed', () => {
          const place = autocompleteElementRef.current.getPlace();
          handlePlaceChanged(place);
        });
        
        console.log('Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    const handlePlaceChanged = (place: any) => {
      if (!place.address_components) {
        return;
      }

      const components: AddressComponents = {};
      
      place.address_components.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          components.street_number = component.long_name;
        }
        if (types.includes('route')) {
          components.route = component.long_name;
        }
        if (types.includes('locality')) {
          components.locality = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          components.administrative_area_level_1 = component.short_name;
        }
        if (types.includes('postal_code')) {
          components.postal_code = component.long_name;
        }
        if (types.includes('country')) {
          components.country = component.short_name;
        }
      });

      onAddressSelect({
        formatted_address: place.formatted_address,
        components
      });
    };



    loadGooglePlacesScript();

    return () => {
      if (autocompleteElementRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteElementRef.current);
        autocompleteElementRef.current = null;
      }
    };
  }, [onAddressSelect]);

  return (
    <Input
      ref={inputRef}
      id={id}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={className}
      autoComplete="off"
    />
  );
}
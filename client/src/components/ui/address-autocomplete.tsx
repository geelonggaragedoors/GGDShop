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
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script is loading, wait for it
        const checkGoogleLoaded = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogleLoaded);
            initializeAutocomplete();
          }
        }, 100);
        return;
      }

      try {
        // Fetch API key from backend
        const response = await fetch('/api/google-places-key');
        const data = await response.json();
        
        // Load Google Maps JavaScript API with proper async loading
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initializeAutocomplete();
        };
        
        document.head.appendChild(script);
      } catch (err) {
        console.error('Failed to load Google Places API key:', err);
      }
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
        return;
      }

      // Use the existing Autocomplete method (still supported)
      autocompleteElementRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry'],
        componentRestrictions: { country: 'AU' } // Restrict to Australia
      });

      autocompleteElementRef.current.addListener('place_changed', () => {
        const place = autocompleteElementRef.current.getPlace();
        handlePlaceChanged(place);
      });
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
      if (autocompleteElementRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteElementRef.current);
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
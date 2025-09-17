import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Package,
  AlertCircle
} from "lucide-react";

export default function DeliveryEbay() {
  const deliveryAddress = "36 Little Myers St, Geelong VIC 3220";
  const phoneNumber = "(03) 5221 9222";
  const mapEmbedUrl = "https://maps.google.com/maps?width=100%&height=400&hl=en&q=36%20Little%20Myers%20Street,%20Geelong%20VIC%203220&t=&z=15&ie=UTF8&iwloc=B&output=embed";

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Factory Delivery - Geelong Garage Doors"
        description="Delivery address and instructions for factory deliveries to Geelong Garage Doors"
        noIndex={true}
      />
      
      <StorefrontHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2b3990] to-[#1e2871] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Factory Delivery
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Delivery location and instructions for factory deliveries to Geelong Garage Doors
          </p>
        </div>
      </section>

      {/* Delivery Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Delivery Details */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-6 h-6 mr-2 text-[#2b3990]" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold" data-testid="text-delivery-address">
                        {deliveryAddress}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button 
                        asChild 
                        size="lg" 
                        className="bg-[#2b3990] hover:bg-[#1e2871]"
                        data-testid="button-call-delivery"
                      >
                        <a href={`tel:${phoneNumber}`}>
                          <Phone className="w-5 h-5 mr-2" />
                          Call {phoneNumber}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-6 h-6 mr-2 text-[#2b3990]" />
                      Delivery Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-amber-800">
                          <p className="font-semibold mb-2" data-testid="text-call-ahead">
                            Please call the office 30 minutes before delivery on {phoneNumber}
                          </p>
                          <p className="text-sm">
                            This ensures someone is available to receive your factory delivery.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Delivery Hours:</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex justify-between">
                          <span>Monday - Friday:</span>
                          <span className="font-medium">7:00 AM - 5:00 PM</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Saturday:</span>
                          <span className="font-medium">Closed</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Sunday:</span>
                          <span className="font-medium">Closed</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">What to have ready:</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Delivery documentation or order number</li>
                        <li>• Photo ID for verification</li>
                        <li>• Clear access for delivery vehicle</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map */}
              <div>
                <Card className="border-0 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle>Location Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-96 rounded-lg overflow-hidden">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        style={{ border: 0 }} 
                        src={mapEmbedUrl}
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Delivery Location Map"
                        data-testid="map-delivery-location"
                      />
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        <strong>For factory deliveries only.</strong> This delivery location is specifically 
                        for delivery drivers dropping off materials to Geelong Garage Doors.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Need Help?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            If you have any questions about your factory delivery or need to arrange 
            an alternative time, please don't hesitate to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-[#2b3990] hover:bg-[#1e2871]"
              data-testid="button-contact-delivery"
            >
              <a href={`tel:${phoneNumber}`}>
                <Phone className="w-5 h-5 mr-2" />
                Call {phoneNumber}
              </a>
            </Button>
            <p className="text-gray-600">Available during business hours</p>
          </div>
        </div>
      </section>

      <StorefrontFooter />
    </div>
  );
}
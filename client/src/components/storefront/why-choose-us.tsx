import { Shield, Clock, Star, Truck, Wrench, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "All our garage doors come with comprehensive warranties and are built to last with premium materials."
  },
  {
    icon: Clock,
    title: "Fast Installation",
    description: "Professional installation typically completed within 2-4 hours with minimal disruption to your day."
  },
  {
    icon: Star,
    title: "Expert Service",
    description: "Over 20 years of experience serving Geelong and surrounding areas with exceptional customer service."
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Free delivery on all orders over $500 within the greater Geelong region and competitive rates beyond."
  },
  {
    icon: Wrench,
    title: "Maintenance Support",
    description: "Ongoing maintenance and repair services to keep your garage door operating smoothly for years to come."
  },
  {
    icon: Award,
    title: "Licensed & Insured",
    description: "Fully licensed professionals with comprehensive insurance coverage for your complete peace of mind."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Geelong Garage Doors?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We're committed to providing the highest quality garage doors and exceptional service 
            to homeowners and businesses throughout the Geelong region.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-white">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <div className="bg-blue-600 text-white py-8 px-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Ready to Upgrade Your Garage Door?</h3>
            <p className="mb-4">Get a free quote today and discover why customers choose us for their garage door needs.</p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Free Quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
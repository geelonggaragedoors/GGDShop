import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Settings, Phone } from "lucide-react";

export default function Services() {
  const services = [
    {
      icon: Settings,
      title: "Professional Installation",
      description: "Expert installation services for all garage door types with comprehensive warranty coverage."
    },
    {
      icon: Wrench,
      title: "Repair & Maintenance",
      description: "24/7 emergency repair services and scheduled maintenance programs to keep your doors operating smoothly."
    },
    {
      icon: Phone,
      title: "Free Consultation",
      description: "Complimentary on-site consultations and quotes for residential and commercial projects."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Our Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="text-center p-6 border hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-semibold mb-3 text-gray-900">{service.title}</h4>
                <p className="text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

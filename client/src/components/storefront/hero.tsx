import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative h-96 hero-gradient text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800')"
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold mb-4">
            Professional Garage Door Solutions
          </h2>
          <p className="text-xl mb-6 text-gray-100">
            Quality residential and commercial garage doors, parts, and expert installation services across Geelong and surrounding areas.
          </p>
          <div className="flex space-x-4">
            <Link href="/products">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                Shop Now
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary"
            >
              Get Quote
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

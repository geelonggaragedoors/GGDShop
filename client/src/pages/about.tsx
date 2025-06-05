import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { QuoteRequestDialog } from "@/components/QuoteRequestDialog";
import { 
  Award, 
  Users, 
  Clock, 
  Shield, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  Star
} from "lucide-react";

const stats = [
  { icon: Users, label: "Happy Customers", value: "5,000+" },
  { icon: Clock, label: "Years Experience", value: "15+" },
  { icon: Award, label: "Projects Completed", value: "10,000+" },
  { icon: Star, label: "Average Rating", value: "4.9/5" }
];

const values = [
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "We use only premium materials and proven installation techniques to ensure your garage door stands the test of time."
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Your satisfaction is our priority. We listen to your needs and deliver solutions that exceed expectations."
  },
  {
    icon: Clock,
    title: "Reliable Service",
    description: "Fast response times and professional service you can count on, backed by comprehensive warranties."
  },
  {
    icon: Award,
    title: "Expert Craftsmanship",
    description: "Our licensed technicians bring years of experience and continuous training to every installation."
  }
];

const team = [
  {
    name: "Steve Ford",
    role: "Founder & Managing Director",
    experience: "20+ years in garage door industry",
    description: "Steve founded Geelong Garage Doors with a vision to provide the Geelong region with honest, reliable garage door solutions."
  },
  {
    name: "Technical Team",
    role: "Licensed Installers",
    experience: "Certified professionals",
    description: "Our team of experienced technicians ensures every installation meets the highest safety and quality standards."
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2b3990] to-[#1e2871] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About Geelong Garage Doors
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Your trusted local garage door specialists serving Geelong and surrounding areas 
            for over 15 years with quality products and exceptional service.
          </p>
          <div className="flex justify-center">
            <QuoteRequestDialog />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-[#2b3990] rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-[#2b3990] mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-6">Serving Geelong Since 2009</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Geelong Garage Doors was founded with a simple mission: to provide the Geelong 
                  region with honest, reliable garage door solutions. What started as a small 
                  local business has grown into the area's most trusted garage door specialist.
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We've built our reputation on quality workmanship, competitive pricing, and 
                  exceptional customer service. Every installation is backed by comprehensive 
                  warranties and ongoing support.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span>Licensed and fully insured</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span>Comprehensive warranties on all work</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span>Local Geelong business</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 p-8 rounded-lg">
                <h4 className="text-xl font-semibold mb-4">Why Choose Us?</h4>
                <ul className="space-y-3 text-gray-600">
                  <li>• Over 15 years of experience in the garage door industry</li>
                  <li>• Serving residential and commercial customers</li>
                  <li>• Fast, reliable service with upfront pricing</li>
                  <li>• Premium quality products from trusted manufacturers</li>
                  <li>• Professional installation and ongoing support</li>
                  <li>• Competitive pricing with no hidden fees</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-[#2b3990]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <Badge className="mb-3 bg-[#2b3990]">{member.role}</Badge>
                  <p className="text-sm text-gray-500 mb-4">{member.experience}</p>
                  <p className="text-gray-600 leading-relaxed">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-[#2b3990] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Work With Us?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get in touch today for a free quote on your garage door project. 
            We're here to help with expert advice and professional installation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <QuoteRequestDialog 
              trigger={
                <Button size="lg" className="bg-white text-[#2b3990] hover:bg-gray-100">
                  Get Free Quote
                </Button>
              }
            />
            <div className="flex items-center space-x-4 text-white">
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                <a href="tel:0352218999" className="hover:underline">
                  (03) 5221 8999
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                <a href="mailto:info@geelonggaragedoors.com.au" className="hover:underline">
                  info@geelonggaragedoors.com.au
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StorefrontFooter />
    </div>
  );
}
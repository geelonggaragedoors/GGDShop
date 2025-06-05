import { Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

export default function StorefrontFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h5 className="text-white font-semibold mb-4">Geelong Garage Doors</h5>
            <p className="text-sm mb-4">
              Professional garage door solutions across Geelong and surrounding areas for over 15 years.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h6 className="text-white font-semibold mb-4">Products</h6>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=residential-doors" className="hover:text-white transition-colors">Residential Doors</Link></li>
              <li><Link href="/products?category=commercial-doors" className="hover:text-white transition-colors">Commercial Doors</Link></li>
              <li><Link href="/products?category=parts-accessories" className="hover:text-white transition-colors">Parts & Accessories</Link></li>
              <li><Link href="/products?category=smart-openers" className="hover:text-white transition-colors">Smart Openers</Link></li>
            </ul>
          </div>
          
          <div>
            <h6 className="text-white font-semibold mb-4">Services</h6>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Installation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Repair & Maintenance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Emergency Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Consultation</a></li>
            </ul>
          </div>
          
          <div>
            <h6 className="text-white font-semibold mb-4">Contact Info</h6>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <i className="fas fa-phone mr-2"></i>
                <a href="tel:0352218999" className="hover:text-white transition-colors">
                  (03) 5221 8999
                </a>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-2"></i>
                <a href="mailto:info@geelonggaragedoors.com.au" className="hover:text-white transition-colors">
                  info@geelonggaragedoors.com.au
                </a>
              </li>
              <li className="flex items-center">
                <i className="fas fa-map-marker-alt mr-2"></i>
                Geelong, VIC 3220
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2024 Geelong Garage Doors. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

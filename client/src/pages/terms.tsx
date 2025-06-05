import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, Phone } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2b3990] to-[#1e2871] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Please read these terms carefully before using our services. 
            These terms govern your use of our website and services.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  By accessing and using the Geelong Garage Doors website and services, 
                  you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Use License</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Permission is granted to temporarily download one copy of the materials 
                  (information or software) on Geelong Garage Doors' website for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
                  <li>attempt to decompile or reverse engineer any software contained on our website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Products and Services</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Information</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We strive to provide accurate product descriptions, specifications, and pricing. 
                    However, we do not warrant that product descriptions or other content is accurate, 
                    complete, reliable, current, or error-free.
                  </p>
                  <h3 className="text-lg font-semibold">Pricing and Payment</h3>
                  <p className="text-gray-600 leading-relaxed">
                    All prices are subject to change without notice. We reserve the right to modify 
                    or discontinue products at any time. Payment terms are due upon completion of work 
                    unless otherwise agreed in writing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Warranties and Disclaimers</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Warranties</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our products come with manufacturer warranties as specified in the product documentation. 
                    Installation work is warranted for the period specified in your service agreement.
                  </p>
                  <h3 className="text-lg font-semibold">Limitation of Liability</h3>
                  <p className="text-gray-600 leading-relaxed">
                    In no event shall Geelong Garage Doors or its suppliers be liable for any damages 
                    (including, without limitation, damages for loss of data or profit, or due to business interruption) 
                    arising out of the use or inability to use the materials on our website.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Installation and Service Terms</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Installation Services</h3>
                  <p className="text-gray-600 leading-relaxed">
                    All installations are performed by licensed professionals in accordance with 
                    Australian building codes and manufacturer specifications. Access to the installation 
                    site must be provided, and the customer is responsible for ensuring adequate access.
                  </p>
                  <h3 className="text-lg font-semibold">Service Appointments</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Service appointments are scheduled based on availability. We require 24 hours notice 
                    for appointment changes or cancellations. A service fee may apply for cancelled appointments 
                    with insufficient notice.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Privacy and Data Protection</h2>
                <p className="text-gray-600 leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information 
                  is governed by our Privacy Policy, which forms part of these terms. 
                  By using our services, you consent to the collection and use of your information 
                  as described in our Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">User Conduct</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  When using our website and services, you agree not to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Use our services for any unlawful purpose or to solicit others to engage in unlawful acts</li>
                  <li>Violate any local, state, national, or international law</li>
                  <li>Infringe upon or violate our intellectual property rights or the rights of others</li>
                  <li>Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>Submit false or misleading information</li>
                  <li>Upload or transmit viruses or any other type of malicious code</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
                <p className="text-gray-600 leading-relaxed">
                  The content, organization, graphics, design, compilation, magnetic translation, 
                  digital conversion and other matters related to our website are protected under 
                  applicable copyrights, trademarks and other proprietary rights. Copying, redistribution, 
                  use or publication of any such matters is strictly prohibited.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Termination</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may terminate or suspend your access to our services immediately, without prior notice 
                  or liability, for any reason whatsoever, including but not limited to a breach of these terms. 
                  Upon termination, your right to use our services will cease immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
                <p className="text-gray-600 leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with the laws 
                  of Victoria, Australia. You irrevocably submit to the exclusive jurisdiction of the 
                  courts in that State or location.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
                <p className="text-gray-600 leading-relaxed">
                  We reserve the right, at our sole discretion, to modify or replace these terms 
                  at any time. If a revision is material, we will try to provide at least 30 days 
                  notice prior to any new terms taking effect. What constitutes a material change 
                  will be determined at our sole discretion.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
                <p className="text-gray-600 leading-relaxed">
                  Any disputes arising out of or relating to these terms shall be resolved through 
                  good faith negotiation. If negotiation fails, disputes may be resolved through 
                  binding arbitration in accordance with the rules of the Australian Commercial 
                  Disputes Centre.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-[#2b3990] text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <p className="mb-6">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    <a href="mailto:info@geelonggaragedoors.com.au" className="hover:underline">
                      info@geelonggaragedoors.com.au
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    <a href="tel:0352218999" className="hover:underline">
                      (03) 5221 8999
                    </a>
                  </div>
                </div>
                <p className="mt-6 text-sm">
                  Effective Date: January 1, 2024<br />
                  Last Updated: January 1, 2024
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <StorefrontFooter />
    </div>
  );
}
import StorefrontHeader from "@/components/storefront/header";
import StorefrontFooter from "@/components/storefront/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Mail, Phone } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <StorefrontHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2b3990] to-[#1e2871] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy explains how we collect, 
            use, and protect your personal information.
          </p>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>Request a quote or contact us through our website</li>
                    <li>Purchase products or services from us</li>
                    <li>Subscribe to our newsletter or communications</li>
                    <li>Create an account on our website</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed">
                    This may include your name, email address, phone number, postal address, 
                    and payment information.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>To provide and maintain our services</li>
                  <li>To process transactions and send related information</li>
                  <li>To respond to your comments, questions, and requests</li>
                  <li>To send you technical notices and support messages</li>
                  <li>To communicate with you about products, services, and events</li>
                  <li>To monitor and analyze usage and trends</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties, 
                  except in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To trusted service providers who assist us in operating our website and business</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a business transfer or acquisition</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Data Security</h2>
                <p className="text-gray-600 leading-relaxed">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. However, 
                  no method of transmission over the internet or electronic storage is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Our website uses cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Improve our website functionality</li>
                  <li>Provide personalized content and advertisements</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  You can control cookie settings through your browser preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Lodge a complaint with relevant authorities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our website may contain links to third-party websites or services. 
                  We are not responsible for the privacy practices of these external sites. 
                  We encourage you to review their privacy policies before providing any personal information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Our services are not directed to individuals under the age of 13. 
                  We do not knowingly collect personal information from children under 13. 
                  If we become aware that we have collected such information, we will take steps to delete it.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any 
                  changes by posting the new policy on this page and updating the effective date. 
                  Your continued use of our services after changes are posted constitutes acceptance 
                  of the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-[#2b3990] text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                <p className="mb-6">
                  If you have any questions about this privacy policy or our data practices, 
                  please contact us:
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
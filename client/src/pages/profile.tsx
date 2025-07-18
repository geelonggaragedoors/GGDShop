import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import StorefrontHeader from '@/components/storefront/header';
import StorefrontFooter from '@/components/storefront/footer';
import AddressAutocomplete from '@/components/ui/address-autocomplete';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Updating profile with data:', data);
      const response = await apiRequest('PUT', '/api/user/profile', data);
      const result = await response.json();
      console.log('Profile update response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Profile update success:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.log('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format address for backend storage
    const stateCodeToName: { [key: string]: string } = {
      'vic': 'VIC',
      'nsw': 'NSW',
      'qld': 'QLD',
      'wa': 'WA',
      'sa': 'SA',
      'tas': 'TAS',
      'act': 'ACT',
      'nt': 'NT'
    };
    
    const stateCode = stateCodeToName[formData.state.toLowerCase()] || formData.state.toUpperCase();
    const fullAddress = `${formData.address}, ${formData.city} ${stateCode} ${formData.postcode}, Australia`;
    
    const profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      address: fullAddress
    };
    
    updateProfileMutation.mutate(profileData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };



  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      console.log('Loading user data into form:', user);
      
      // Parse the address from the user profile
      let parsedCity = '';
      let parsedState = '';
      let parsedPostcode = '';
      let streetAddress = user.address || '';
      
      if (user.address) {
        // Handle addresses like "3 Conquest St, Mount Duneed VIC 3217, Australia"
        const addressParts = user.address.split(',');
        if (addressParts.length >= 3) {
          streetAddress = addressParts[0].trim();
          parsedCity = addressParts[1].trim();
          
          // Parse the state and postcode from the last part before country
          const statePostcodePart = addressParts[2].trim();
          const statePostcodeMatch = statePostcodePart.match(/^(.+?)\s+(\d{4})$/);
          if (statePostcodeMatch) {
            const stateFullName = statePostcodeMatch[1].trim();
            parsedPostcode = statePostcodeMatch[2];
            
            // Convert state name to code
            const stateMap: { [key: string]: string } = {
              'VIC': 'vic',
              'Victoria': 'vic',
              'NSW': 'nsw',
              'New South Wales': 'nsw',
              'QLD': 'qld',
              'Queensland': 'qld',
              'WA': 'wa',
              'Western Australia': 'wa',
              'SA': 'sa',
              'South Australia': 'sa',
              'TAS': 'tas',
              'Tasmania': 'tas',
              'ACT': 'act',
              'Australian Capital Territory': 'act',
              'NT': 'nt',
              'Northern Territory': 'nt'
            };
            
            parsedState = stateMap[stateFullName] || stateFullName.toLowerCase();
          }
        }
      }
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: streetAddress,
        city: parsedCity,
        state: parsedState,
        postcode: parsedPostcode,
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <>
        <StorefrontHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <StorefrontFooter />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StorefrontHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You need to be logged in to view your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/api/login">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <StorefrontFooter />
      </>
    );
  }

  return (
    <>
      <StorefrontHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your email address"
                      disabled
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Geelong"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        placeholder="3220"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vic">Victoria</SelectItem>
                        <SelectItem value="nsw">New South Wales</SelectItem>
                        <SelectItem value="qld">Queensland</SelectItem>
                        <SelectItem value="wa">Western Australia</SelectItem>
                        <SelectItem value="sa">South Australia</SelectItem>
                        <SelectItem value="tas">Tasmania</SelectItem>
                        <SelectItem value="act">Australian Capital Territory</SelectItem>
                        <SelectItem value="nt">Northern Territory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <StorefrontFooter />
    </>
  );
}
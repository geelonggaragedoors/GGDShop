import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Send } from 'lucide-react';

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('POST', '/api/admin/email-test', {
        testEmail: testEmail
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message });
        toast({
          title: "Success",
          description: "Test email sent successfully!",
        });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email' });
        toast({
          title: "Error",
          description: data.error || 'Failed to send test email',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      setResult({ success: false, message: 'Network error occurred' });
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Test</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Test the email system by sending a test email to any address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSendTest}
            disabled={loading || !testEmail}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Current email settings for Geelong Garage Doors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>From Address:</strong> orders@geelonggaragedoors.com</div>
            <div><strong>Service:</strong> SendGrid</div>
            <div><strong>Status:</strong> <span className="text-green-600">Active</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
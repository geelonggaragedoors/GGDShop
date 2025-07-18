import { Resend } from 'resend';

// Simple test to verify Resend API works
async function testResend() {
  console.log('Testing Resend API...');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not found in environment variables');
    return;
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Geelong Garage Doors <orders@geelonggaragedoors.com>',
      to: ['stevejford007@gmail.com'],
      subject: 'Test Email - Resend API',
      html: '<h1>Hello!</h1><p>This is a test email from Resend API using Node.js</p><p><strong>It works!</strong></p>',
    });

    if (error) {
      console.error('Resend API Error:', error);
    } else {
      console.log('Email sent successfully!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('Error testing Resend:', error);
  }
}

testResend();
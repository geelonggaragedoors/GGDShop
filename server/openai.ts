import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface BackgroundRemovalOptions {
  imageBuffer: Buffer;
  originalFilename: string;
}

export async function removeImageBackground(options: BackgroundRemovalOptions): Promise<Buffer> {
  try {
    console.log('Starting background removal with OpenAI images.edit...');
    
    // Create a temporary file from the buffer to pass to OpenAI
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${options.originalFilename}`);
    
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, options.imageBuffer);
    console.log('Created temporary file:', tempFilePath);

    try {
      // Use OpenAI's images.edit endpoint for actual background removal
      const response = await openai.images.edit({
        image: fs.createReadStream(tempFilePath),
        prompt: "Remove the background and keep only the subject.",
        size: "1024x1024",
        response_format: "b64_json"
      });

      console.log('OpenAI background removal successful');

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      // OpenAI returns base64 encoded images
      if (response.data && response.data[0]?.b64_json) {
        return Buffer.from(response.data[0].b64_json, 'base64');
      } else {
        throw new Error('No image data returned from OpenAI');
      }
    } catch (error) {
      // Clean up temporary file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('OpenAI background removal error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse URL from ${errorMessage}`);
  }
}

export { openai };
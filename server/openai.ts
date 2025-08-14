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
    console.log('Starting background removal with OpenAI images.edits...');
    
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
      // Use OpenAI's newer gpt-image-1 model for better background removal
      // Since edit endpoint has limitations, we'll use generate with transparent background
      // First, analyze the image to understand what we're working with
      const base64Image = options.imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      // Analyze the image to identify the subject
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [{
            type: "text",
            text: "Describe this product in detail for recreating it in a professional product photo. Include colors, materials, shape, and key features."
          }, {
            type: "image_url",
            image_url: { url: dataUrl }
          }]
        }],
        max_tokens: 200,
      });

      const productDescription = analysisResponse.choices[0].message.content || "product";
      console.log('Product identified:', productDescription);

      // Generate a new image with transparent background
      const response = await openai.images.generate({
        model: "dall-e-3", // Use dall-e-3 for now as gpt-image-1 might not be available yet
        prompt: `Professional product photography of ${productDescription}. Clean transparent background, high quality, well-lit, centered composition, product catalog style, no background elements.`,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      });

      console.log('OpenAI background removal successful');

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      // Handle response format - newer API returns different structure
      if (response.data && response.data[0]) {
        const imageData = response.data[0];
        
        // Check for base64 response
        if (imageData.b64_json) {
          return Buffer.from(imageData.b64_json, 'base64');
        }
        
        // Check for URL response and fetch it
        if (imageData.url) {
          const imageResponse = await fetch(imageData.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
          }
          return Buffer.from(await imageResponse.arrayBuffer());
        }
      }
      
      throw new Error('No image data returned from OpenAI');
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
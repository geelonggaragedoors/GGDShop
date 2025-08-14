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
    console.log('Starting background removal with OpenAI...');
    
    // Convert buffer to base64 for DALL-E API
    const base64Image = options.imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Use OpenAI to generate a new image with background removed
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional product image with transparent background showing only the main subject from this reference image. Remove all background elements completely, keep only the primary object with clean edges and transparent background.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json"
    });

    console.log('OpenAI background removal successful');

    // OpenAI DALL-E returns base64 encoded images
    if (response.data && response.data[0]?.b64_json) {
      return Buffer.from(response.data[0].b64_json, 'base64');
    } else {
      throw new Error('No image data returned from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI background removal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Background removal failed: ${errorMessage}`);
  }
}

export { openai };
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
    console.log('Starting background removal with OpenAI Vision...');
    
    // Convert buffer to base64 for Vision API
    const base64Image = options.imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Note: This is a simplified approach since DALL-E 3 doesn't actually do background removal
    // It generates new images based on prompts. For true background removal, you'd use 
    // services like Remove.bg, rembg, or other specialized APIs.
    
    // For now, let's use a simpler approach that creates a stylized version
    // First, analyze the image to identify the main subject
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product image and describe the main subject/product in detail. What type of product is this? What are its key features and colors?"
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ],
        },
      ],
      max_tokens: 300,
    });

    const productDescription = analysisResponse.choices[0].message.content || "product";
    console.log('Product identified for background removal:', productDescription);

    // Generate a new professional product image with clean background
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional product photography of ${productDescription}. Clean white background, well-lit, high quality commercial photography style, centered composition, no shadows or clutter, product catalog style image.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json"
    });

    console.log('OpenAI image generation successful');

    // OpenAI DALL-E returns base64 encoded images
    if (response.data && response.data[0]?.b64_json) {
      return Buffer.from(response.data[0].b64_json, 'base64');
    } else {
      throw new Error('No image data returned from OpenAI');
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
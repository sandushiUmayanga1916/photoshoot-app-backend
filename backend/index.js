const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to generate the prompt
const generatePhotoshootPrompt = (formData) => {
  const commonElements = `
    Professional photoshoot with high-end production quality
    Resolution: 4K, Ultra-sharp details
    Color grading: Cinematic, professional post-processing
    Lighting: ${formData.timeOfDay} with precise light control
  `;

  if (formData.type === 'person') {
    return `
      ${commonElements}
      Subject:
      - Gender: ${formData.personGender}
      - Age Range: ${formData.personAge}
      - Hairstyle: ${formData.personHairstyle}
      - Clothing Style: ${formData.personClothing}
      - Pose: Dynamic, confident, professional

      Location: ${formData.location}
      Photography Style: ${formData.style} with editorial precision
      Number of People: ${formData.numberOfItems}
      
      Creative Nuances:
      ${formData.additionalDetails || 'Sophisticated, contemporary aesthetic'}
      Focus on capturing authentic human emotion and professional elegance
    `;
  } else {
    return `
      ${commonElements}
      Product Details:
      - Type: ${formData.productType}
      - Color: ${formData.productColor}
      - Material: ${formData.productMaterial}
      - Brand Aesthetic: ${formData.productBrand}

      Product Photography:
      - Location: ${formData.location}
      - Style: ${formData.style} with premium marketing approach
      - Number of Items: ${formData.numberOfItems}
      
      Creative Direction:
      ${formData.additionalDetails || 'Minimalist, high-end product presentation'}
      Emphasize product details, texture, and luxury positioning
    `;
  }
};

// Endpoint to generate photoshoot
app.post('/generate-photoshoot', async (req, res) => {
  try {
    const formData = req.body;

    if (!formData.type || !formData.location || !formData.style) {
      return res.status(400).json({ error: 'Missing required photoshoot parameters' });
    }

    const prompt = generatePhotoshootPrompt(formData);
    const imageGenerationOptions = {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    };

    const imagePromises = Array(formData.numberOfItems)
      .fill()
      .map(async () => {
        const imageResponse = await openai.images.generate(imageGenerationOptions);
        return imageResponse.data[0].url;
      });

    const images = await Promise.all(imagePromises);

    res.json({
      images: images,
      prompt: prompt,
    });
  } catch (error) {
    console.error('Photoshoot Generation Error:', error);
    res.status(500).json({
      error: 'Failed to generate photoshoot images',
      details: error.message,
    });
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

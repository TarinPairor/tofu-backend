# Tofu Backend

## Environment Variables

Required environment variables:
```
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in the root directory and add your Perplexity API key.

3. Run the development server:
```bash
pnpm dev
```

## API Endpoints

### POST /scrape
Extracts product information from a URL using Perplexity AI.

Request body:
```json
{
  "url": "https://example.com/product"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "productName": "Product Name",
    "description": "Product Description",
    "features": ["Feature 1", "Feature 2", ...]
  }
}
```

The response format may vary slightly as it comes directly from Perplexity AI's natural language processing.

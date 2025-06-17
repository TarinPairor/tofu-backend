const cheerio = require('cheerio');
const { OpenAI } = require('openai');

/**
 * Configuration object for product extraction
 * @typedef {Object} ProductExtractionConfig
 * @property {number} maxCharacters - Maximum number of characters to process
 * @property {string[]} selectors - CSS selectors to target product content
 */

/**
 * Product information structure
 * @typedef {Object} ProductInfo
 * @property {string} product_name - Name of the product
 * @property {string} product_description - Description of the product
 * @property {string[]} key_features - Array of product features
 */

/**
 * Default configuration for product extraction
 */
const DEFAULT_CONFIG = {
  maxCharacters: 8000,
  selectors: [
    'main',
    '[class*="product"]',
    '[class*="description"]',
    '[id*="product"]',
    '[id*="description"]'
  ]
};

/**
 * Extracts clean text content from HTML
 * @param {string} html - Raw HTML content
 * @param {ProductExtractionConfig} config - Configuration options
 * @returns {string} Cleaned and trimmed text content
 */
function extractTextFromHtml(html, config = DEFAULT_CONFIG) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script').remove();
  $('style').remove();
  
  // Get main content areas using provided selectors
  const mainContent = $(config.selectors.join(', ')).text().trim();
  let textContent = mainContent || $('body').text().trim();
  
  // Limit text content
  return textContent.substring(0, config.maxCharacters);
}

/**
 * Analyzes text content using OpenAI to extract product information
 * @param {string} textContent - Text content to analyze
 * @param {OpenAI} openai - Initialized OpenAI client
 * @returns {Promise<ProductInfo>} Extracted product information
 * @throws {Error} If OpenAI analysis fails or returns invalid JSON
 */
async function analyzeProductContent(textContent, openai) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a product information extractor. Analyze the text and return a JSON object with the following structure: {\"product_name\": string, \"product_description\": string, \"key_features\": string[]}. If no clear product information is found, return {\"product_name\": \"\", \"product_description\": \"\", \"key_features\": []}."
      },
      {
        role: "user",
        content: `Analyze this product text and return structured data: ${textContent}`
      }
    ]
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Main function to scrape and analyze product information from a URL
 * @param {string} url - URL to scrape
 * @param {string} apiKey - OpenAI API key
 * @param {ProductExtractionConfig} config - Optional configuration
 * @returns {Promise<ProductInfo>} Extracted product information
 * @throws {Error} If URL is invalid, scraping fails, or analysis fails
 */
async function scrapeProductInfo(url, apiKey, config = DEFAULT_CONFIG) {
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error('Invalid URL format');
  }

  // Initialize OpenAI
  const openai = new OpenAI({ apiKey });

  // Fetch webpage content
  const response = await fetch(url);
  const html = await response.text();

  // Extract and clean text content
  const textContent = extractTextFromHtml(html, config);

  // Analyze content
  return await analyzeProductContent(textContent, openai);
}

module.exports = {
  scrapeProductInfo,
  extractTextFromHtml,
  analyzeProductContent,
  DEFAULT_CONFIG
}; 
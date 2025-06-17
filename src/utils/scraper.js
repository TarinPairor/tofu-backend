const cheerio = require('cheerio');
const { OpenAI } = require('openai');

/**
 * Extracts text content from HTML
 * @param {string} html - Raw HTML content
 * @returns {string} Raw text content
 */
function extractTextFromHtml(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style').remove();
  
  // Get all text content
  const text = $('body').text().trim();
  
  // Limit to approximately 2000 tokens (about 8000 characters)
  // This ensures we stay well under the 10000 token limit while leaving room for the response
  return text.substring(0, 8000);
}

/**
 * Gets GPT's interpretation of the content
 * @param {string} textContent - Text content to analyze
 * @param {OpenAI} openai - Initialized OpenAI client
 * @returns {Promise<string>} GPT's response
 */
async function analyzeContent(textContent, openai) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Given this webpage content which contains a product give me the product name, the description and key features of the product."
      },
      {
        role: "user",
        content: textContent
      }
    ],
    max_tokens: 1000 // Limit response size
  });

  return completion.choices[0].message.content;
}

/**
 * Main function to scrape and analyze content from a URL
 * @param {string} url - URL to scrape
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Analysis of the content
 */
async function scrapeContent(url, apiKey) {
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

  // Extract text content
  const textContent = extractTextFromHtml(html);

  // Get GPT's analysis
  return await analyzeContent(textContent, openai);
}

module.exports = {
  scrapeContent
}; 
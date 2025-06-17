const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { By, until } = require('selenium-webdriver');

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
    max_tokens: 1000
  });

  return completion.choices[0].message.content;
}

/**
 * Fetches content from a URL using Selenium WebDriver
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
async function fetchWithSelenium(url) {
  // Configure Chrome options
  const options = new chrome.Options();
  options.addArguments(
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080'
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // Navigate to the URL with a generous timeout
    await driver.get(url);

    // Check if it's a Shopee page by looking for loading dots
    try {
      const loadingDot = await driver.findElement(By.css('circle.loading-dot'));
      if (loadingDot) {
        // Wait until loading dots disappear (page fully loaded)
        await driver.wait(until.stalenessOf(loadingDot), 10000);
      }
    } catch (e) {
      // Not a Shopee page or no loading dots found, continue with normal loading
      await driver.executeScript('return new Promise(resolve => {' +
        'if (document.readyState === "complete") resolve();' +
        'else window.addEventListener("load", resolve);' +
      '})');
    }

    // Give a short delay for any final JavaScript execution
    await driver.sleep(1500);

    // Get the raw page source
    return await driver.getPageSource();

  } finally {
    await driver.quit();
  }
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

  try {
    // Fetch webpage content using Selenium
    const html = await fetchWithSelenium(url);

    // Extract text content
    const textContent = extractTextFromHtml(html);

    // Get GPT's analysis
    return await analyzeContent(textContent, openai);
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to scrape content: ${error.message}`);
  }
}

module.exports = {
  scrapeContent
}; 
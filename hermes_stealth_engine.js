/**
 * ==============================================================================
 * HERMES STEALTH AUTOMATION ENGINE
 * Unified Autonomous Web & Form Automation
 * Powered by: Puppeteer-Extra + Stealth Plugin + Gemini AI Brain
 * 100% Free / Zero Paid API Requirement
 * ==============================================================================
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Attach Stealth Plugin to mask automation fingerprint
puppeteer.use(StealthPlugin());

class HermesStealthEngine {
  constructor(options = {}) {
    this.headless = options.headless !== undefined ? options.headless : true;
    this.browser = null;
    this.page = null;
  }

  async launch() {
    console.log(`[Hermes Engine] Initializing Stealth Browser (Headless: ${this.headless})...`);
    this.browser = await puppeteer.launch({
      headless: this.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1366,768'
      ],
      defaultViewport: { width: 1366, height: 768 }
    });

    this.page = await this.browser.newPage();

    // Set human user-agent and language headers
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await this.page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9,hi;q=0.8'
    });

    console.log('[Hermes Engine] Stealth browser active & ready.');
    return this.page;
  }

  /**
   * Safely opens any URL with stealth checks
   */
  async navigateTo(url, waitUntil = 'networkidle2') {
    if (!this.page) await this.launch();
    console.log(`[Hermes Engine] Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil, timeout: 45000 });
    console.log(`[Hermes Engine] Page loaded successfully: ${await this.page.title()}`);
  }

  /**
   * Human-like typing with random jitter (prevents bot detection)
   */
  async typeHuman(selector, text) {
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: Math.floor(Math.random() * 40) + 20 });
    }
  }

  /**
   * Fills multiple form inputs cleanly
   * inputs: [ { selector: '#name', value: 'John' }, ... ]
   */
  async fillForm(inputs = []) {
    console.log(`[Hermes Engine] Filling ${inputs.length} form fields...`);
    for (const input of inputs) {
      try {
        await this.typeHuman(input.selector, input.value);
        console.log(`  ✓ Filled field: ${input.selector}`);
        await new Promise(r => setTimeout(r, Math.random() * 300 + 200));
      } catch (err) {
        console.warn(`  ⚠ Warning on ${input.selector}: ${err.message}`);
      }
    }
  }

  /**
   * Selects an option in a dropdown
   */
  async selectDropdown(selector, value) {
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.select(selector, value);
    console.log(`  ✓ Selected option in: ${selector}`);
  }

  /**
   * Clicks a button by selector or by visible text
   */
  async clickButton(selectorOrText) {
    console.log(`[Hermes Engine] Clicking: ${selectorOrText}...`);
    try {
      if (selectorOrText.startsWith('#') || selectorOrText.startsWith('.') || selectorOrText.startsWith('[')) {
        await this.page.waitForSelector(selectorOrText, { timeout: 10000 });
        await this.page.click(selectorOrText);
      } else {
        // Find by text inside button or input[type="submit"]
        const clicked = await this.page.evaluate((text) => {
          const elements = Array.from(document.querySelectorAll('button, input[type="submit"], a, [role="button"]'));
          const target = elements.find(el => (el.innerText || el.value || '').trim().toLowerCase().includes(text.toLowerCase()));
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, selectorOrText);

        if (!clicked) {
          throw new Error(`Element with text "${selectorOrText}" not found.`);
        }
      }
      console.log(`  ✓ Successfully clicked: ${selectorOrText}`);
    } catch (err) {
      console.error(`  ❌ Failed to click ${selectorOrText}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Attaches a file to a file input
   */
  async attachFile(inputSelector, filePath) {
    console.log(`[Hermes Engine] Attaching file: ${filePath}`);
    const input = await this.page.$(inputSelector);
    if (!input) throw new Error(`File input not found: ${inputSelector}`);
    await input.uploadFile(filePath);
    console.log('  ✓ File attached successfully.');
  }

  /**
   * Saves receipt or confirmation screenshot
   */
  async saveReceipt(outputPath) {
    await this.page.screenshot({ path: outputPath, fullPage: true });
    console.log(`[Hermes Engine] Confirmation receipt saved: ${outputPath}`);
    return outputPath;
  }

  /**
   * Closes browser cleanly
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('[Hermes Engine] Browser closed cleanly.');
    }
  }
}

module.exports = HermesStealthEngine;

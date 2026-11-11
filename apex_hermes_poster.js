/**
 * ==============================================================================
 * APEX HERMES STEALTH AUTONOMOUS POSTER & SOCIAL PUBLISHER
 * ==============================================================================
 * Powered by:
 *  - Hermes Stealth Engine (Puppeteer Extra + Stealth Plugin)
 *  - Direct Chrome User Profile Attachment (Re-uses active Google/YT sessions)
 *  - Automated Video Uploading, Title, Tag & Description Injection
 *  - Full Receipt Screenshots & Audit Trails
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const LOGS_DIR = path.join(__dirname, 'automation_logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

class ApexHermesPoster {
  constructor(options = {}) {
    this.headless = options.headless !== undefined ? options.headless : false; // Default non-headless so user can see & solve OTP
    this.browser = null;
    this.page = null;
    this.userDataDir = options.userDataDir || 'C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\User Data';
  }

  /**
   * Launch Stealth Chrome connected to user profile
   */
  async launch(useDefaultProfile = false) {
    console.log(`[Apex Hermes Poster] Launching Stealth Engine (Headless: ${this.headless})...`);
    
    const launchArgs = [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ];

    const launchOptions = {
      headless: this.headless ? 'new' : false,
      defaultViewport: null,
      args: launchArgs
    };

    if (useDefaultProfile && fs.existsSync(this.userDataDir)) {
      console.log(`[Apex Hermes Poster] Attaching to Chrome User Profile at: ${this.userDataDir}`);
      launchOptions.userDataDir = this.userDataDir;
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();

    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    );

    console.log('[Apex Hermes Poster] Stealth Browser initialized & active.');
    return this.page;
  }

  /**
   * Upload Video to YouTube Studio
   */
  async publishToYouTube(videoPath, metadata = {}, options = {}) {
    console.log(`[Apex Hermes Poster] Commencing YouTube Studio publishing for: ${videoPath}`);
    if (!fs.existsSync(videoPath)) throw new Error(`Video file does not exist: ${videoPath}`);

    if (!this.page) await this.launch(options.useProfile !== false);

    try {
      console.log('[Apex Hermes Poster] Navigating to YouTube Studio...');
      await this.page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 4000));

      const currentUrl = this.page.url();
      console.log(`[Apex Hermes Poster] Active URL: ${currentUrl}`);

      // Check if login is required
      if (currentUrl.includes('accounts.google.com') || currentUrl.includes('signin')) {
        console.log('🚨 [ACTION REQUIRED] Google Sign-in requested. Please verify your Google account or SMS OTP in the browser.');
        const snap = path.join(LOGS_DIR, `yt_login_prompt_${Date.now()}.png`);
        await this.page.screenshot({ path: snap });
        return { status: 'AWAITING_USER_LOGIN', currentUrl, screenshot: snap };
      }

      // Check for Create / Upload button
      console.log('[Apex Hermes Poster] Locating YouTube Studio Upload Button...');
      await this.page.waitForSelector('#create-icon, ytcp-button#create-icon, [aria-label="Create"]', { timeout: 15000 });
      await this.page.click('#create-icon, ytcp-button#create-icon, [aria-label="Create"]');
      await new Promise(r => setTimeout(r, 1500));

      // Click "Upload videos"
      const uploadItem = await this.page.$('#text-item-0, ytcp-text-menu [test-id="upload"]');
      if (uploadItem) await uploadItem.click();

      // Attach file
      console.log(`[Apex Hermes Poster] Uploading file payload: ${videoPath}...`);
      await this.page.waitForSelector('input[type="file"]', { timeout: 15000 });
      const fileInput = await this.page.$('input[type="file"]');
      await fileInput.uploadFile(videoPath);

      await new Promise(r => setTimeout(r, 6000));
      console.log('[Apex Hermes Poster] Video payload attached. Entering metadata...');

      // Title
      if (metadata.title) {
        const titleInput = await this.page.$('#title-textarea #textbox');
        if (titleInput) {
          await titleInput.click();
          await this.page.keyboard.down('Control');
          await this.page.keyboard.press('A');
          await this.page.keyboard.up('Control');
          await this.page.keyboard.press('Backspace');
          await titleInput.type(metadata.title, { delay: 30 });
        }
      }

      // Description
      if (metadata.description) {
        const descInput = await this.page.$('#description-textarea #textbox');
        if (descInput) {
          await descInput.click();
          await descInput.type(metadata.description, { delay: 20 });
        }
      }

      const uploadSnap = path.join(LOGS_DIR, `yt_upload_state_${Date.now()}.png`);
      await this.page.screenshot({ path: uploadSnap });
      console.log(`[✓] YouTube Upload drafted successfully. Screenshot: ${uploadSnap}`);

      return {
        status: 'SUCCESS_DRAFTED',
        video: videoPath,
        title: metadata.title,
        receipt: uploadSnap
      };
    } catch (err) {
      console.error('[Apex Hermes Poster Error]:', err.message);
      const errSnap = path.join(LOGS_DIR, `yt_error_${Date.now()}.png`);
      await this.page.screenshot({ path: errSnap }).catch(() => {});
      return { status: 'ERROR', message: err.message, screenshot: errSnap };
    }
  }

  /**
   * Upload Video to Instagram Web
   */
  async publishToInstagram(videoPath, metadata = {}, credentials = {}) {
    console.log(`[Apex Hermes Poster] Commencing Instagram Web publishing for: ${videoPath}`);
    if (!this.page) await this.launch();

    try {
      console.log('[Apex Hermes Poster] Navigating to Instagram...');
      await this.page.goto('https://www.instagram.com', { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(r => setTimeout(r, 3000));

      const currentUrl = this.page.url();
      if (currentUrl.includes('accounts/login')) {
        console.log('[Apex Hermes Poster] Logging in with provided credentials...');
        if (credentials.username && credentials.password) {
          await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
          await this.page.type('input[name="username"]', credentials.username, { delay: 100 });
          await this.page.type('input[name="password"]', credentials.password, { delay: 100 });
          const loginBtn = await this.page.$('button[type="submit"]');
          if (loginBtn) await loginBtn.click();
          await new Promise(r => setTimeout(r, 6000));
        }
      }

      const snap = path.join(LOGS_DIR, `insta_state_${Date.now()}.png`);
      await this.page.screenshot({ path: snap });
      return { status: 'BROWSER_READY', currentUrl: this.page.url(), screenshot: snap };
    } catch (err) {
      console.error('[Apex Hermes Poster Instagram Error]:', err.message);
      return { status: 'ERROR', message: err.message };
    }
  }

  /**
   * Clean Close
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('[Apex Hermes Poster] Browser closed cleanly.');
    }
  }
}

module.exports = ApexHermesPoster;

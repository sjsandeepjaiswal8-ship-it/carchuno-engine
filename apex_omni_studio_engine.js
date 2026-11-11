/**
 * ==============================================================================
 * APEX OMNI STUDIO™ AUTONOMOUS VIDEO & BRAND PRODUCTION ENGINE
 * ==============================================================================
 * Seamlessly integrates:
 *  1. Gemini AI Rotator (100% Dynamic Storyboarding, Hooks & Viral SEO)
 *  2. MsEdgeTTS Broadcast Neural Voices (Zero-Cost, Unlimited Duration)
 *  3. Dynamic 60FPS Kinetic Canvas Compositor (No 2D Slideshows!)
 *  4. SFX & Ambient Audio Ducking Engine
 *  5. FFmpeg H.264 Broadcast-Grade Mastering
 *  6. Hermes Stealth Autonomous Web & Social Publisher
 *
 * Supported Brands:
 *  - CarChuno (Automotive Marketplace & Reverse Bidding, Like CarDekho/MotorOctane)
 *  - CloseTesters Labs (Android 20-Tester OEM Rack & Google Play Approval)
 *  - Astro Masterpiece (Cosmic Drishti - Sacred Vedic Astrology & Akashic Engine)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const { callGeminiAI } = require('./dynamic_seo_engine');

// Configuration Paths
const FFMPEG_PATH = 'C:/Users/HP/Desktop/AI_Video_Engine/node_modules/ffmpeg-static/ffmpeg.exe';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RENDERS_DIR = path.join(__dirname, 'renders');
const ASSETS_DIR = path.join(__dirname, 'assets');
const SFX_DIR = path.join(ASSETS_DIR, 'sfx');
const VISUALS_DIR = path.join(ASSETS_DIR, 'brand_visuals');

if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

// Brand Rules & Defaults
const BRAND_PRESETS = {
  CarChuno: {
    brandName: "CarChuno (कार चुनो)",
    tagline: "Bharat Ka Smartest Car Buying & Reverse Bidding Platform",
    website: "https://carchuno.com",
    primaryColor: "#FF1E27",
    accentColor: "#FFD700",
    defaultVoice: "hi-IN-MadhurNeural",
    guardrails: [
      "Targeting CarDekho, MotorOctane, DDS, CarWale audience",
      "Highlight 61 Verified OEM Dealerships across 14 States",
      "Emphasize Reverse Bidding (Dealers compete, you save up to ₹1,70,000)",
      "Zero Hidden Charges, Bank Loan EMI Hacks"
    ],
    assetExterior: path.join(VISUALS_DIR, 'live_safari_360_exterior.png'),
    assetInterior: path.join(VISUALS_DIR, 'live_safari_360_interior.png'),
    assetPlatform: path.join(VISUALS_DIR, 'live_carchuno.png')
  },
  CloseTesters: {
    brandName: "CloseTesters Labs",
    tagline: "100% Guaranteed Google Play 20-Tester Production Approval in 14 Days",
    website: "https://closetesters.com",
    primaryColor: "#F43F5E",
    accentColor: "#10B981",
    defaultVoice: "en-US-ChristopherNeural",
    guardrails: [
      "Strict: 20 Real Hardware OEM Devices (Zero Emulators)",
      "14-Day Production Track Pass Guarantee",
      "Google Play Declaration Copilot (< 300 Chars, Anti-Rejection Phrasing)",
      "Target Indie Hackers, Flutter/Kotlin Developers, Agencies"
    ],
    assetRack: path.join(VISUALS_DIR, 'live_closetesters.png'),
    assetMain: path.join(VISUALS_DIR, 'live_closetesters_main.png'),
    assetReceipt: path.join(VISUALS_DIR, 'test_form_receipt.png')
  },
  AstroMasterpiece: {
    brandName: "AstroMasterpiece",
    tagline: "Vedic Astrology, Navgrah Remedies & Akashic Kundali Intelligence",
    website: "https://astromasterpiece.com",
    whatsapp: "+91 91313 65866",
    primaryColor: "#8B5CF6",
    accentColor: "#FBBF24",
    defaultVoice: "hi-IN-SwaraNeural",
    guardrails: [
      "STRICT MANDATE: 100% Anonymous Sacred Persona. Zero mention of Payal Jaiswal.",
      "Vedic 10-Pillar Kundali Analysis and Akashic Engine",
      "Navgrah Dosha & Shani Sade Sati accurate remedies",
      "Direct confidential 1-on-1 WhatsApp Booking: +91 91313 65866"
    ],
    assetSanctum: path.join(VISUALS_DIR, 'cosmic_sanctum_8k.jpg'),
    assetPalm: path.join(VISUALS_DIR, 'cosmic_palmistry_8k.jpg'),
    assetHavan: path.join(VISUALS_DIR, 'cosmic_havan_8k.jpg')
  }
};

class ApexOmniStudioEngine {
  /**
   * 1. Dynamic Script & Viral Metadata Generation via Gemini Rotator
   */
  static async generateCampaignDossier(brandKey, customPrompt = '') {
    const brand = BRAND_PRESETS[brandKey] || BRAND_PRESETS.CarChuno;
    console.log(`[APEX Omni Studio] Brainstorming viral campaign for: ${brand.brandName}...`);

    const systemPrompt = `
You are the Chief Creative Officer and Viral Video Director at APEX OMNI STUDIO.
Generate a high-retention, high-converting 5-beat short-form video storyboard and publishing metadata.
Brand: ${brand.brandName}
Tagline: ${brand.tagline}
Guardrails & Policies:
${brand.guardrails.map(g => `- ${g}`).join('\n')}

Output MUST be strictly valid JSON matching this schema:
{
  "campaign_name": "string",
  "language": "Hindi" | "English",
  "voice": "${brand.defaultVoice}",
  "scenes": [
    {
      "scene_id": 1,
      "beat": "HOOK",
      "speech_text": "High tension punchy opening spoken script (15-25 words)",
      "screen_headline": "SHORT PUNCHY 4-5 WORD TEXT FOR SCREEN",
      "highlight_words": ["WORD1", "WORD2"],
      "visual_theme": "dark_alert" | "cyber_tech" | "cosmic_gold" | "luxury_carbon",
      "metric_label": "e.g. SHOWROOM OVERCHARGE",
      "metric_value": "₹1,85,000"
    },
    {
      "scene_id": 2,
      "beat": "PROBLEM_AGITATION",
      "speech_text": "Deep emotional or financial pain point (25-35 words)",
      "screen_headline": "PAIN POINT TEXT",
      "highlight_words": ["WORD1", "WORD2"],
      "visual_theme": "dark_alert",
      "metric_label": "e.g. REJECTION RISK",
      "metric_value": "89%"
    },
    {
      "scene_id": 3,
      "beat": "SOLUTION_REVEAL",
      "speech_text": "Platform breakthrough and feature proof (25-35 words)",
      "screen_headline": "PLATFORM FEATURE",
      "highlight_words": ["WORD1", "WORD2"],
      "visual_theme": "luxury_carbon",
      "metric_label": "e.g. DEALERS BIDDING",
      "metric_value": "61 DEALERS"
    },
    {
      "scene_id": 4,
      "beat": "PROOF_METRICS",
      "speech_text": "Irrefutable metrics, guarantees, or savings (20-30 words)",
      "screen_headline": "GUARANTEED RESULT",
      "highlight_words": ["WORD1", "WORD2"],
      "visual_theme": "cyber_tech",
      "metric_label": "e.g. TOTAL SAVINGS",
      "metric_value": "₹1,70,000"
    },
    {
      "scene_id": 5,
      "beat": "CALL_TO_ACTION",
      "speech_text": "Clear immediate action step (15-20 words)",
      "screen_headline": "VISIT TODAY",
      "highlight_words": ["NOW", "LINK IN BIO"],
      "visual_theme": "cosmic_gold",
      "metric_label": "e.g. OFFICIAL WEBSITE",
      "metric_value": "${brand.website.replace('https://', '')}"
    }
  ],
  "youtube_metadata": {
    "title": "High CTR Click-Worthy Title (under 70 chars with bracket & emoji)",
    "description": "Full YouTube description with key value props, chapters, and links",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
  },
  "instagram_metadata": {
    "caption": "Viral Instagram caption formatted with linebreaks and emojis",
    "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5"
  }
}
`;

    const userPrompt = customPrompt 
      ? `Create a viral video storyboard focusing on: ${customPrompt}`
      : `Create the highest-converting flagship video storyboard for ${brand.brandName} in Indian Hinglish / English. Make it rival CarDekho, MotorOctane, and top tier content creators.`;

    const rawJson = await callGeminiAI(userPrompt, systemPrompt, 4096);
    let dossier;
    try {
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      dossier = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('[APEX Omni Studio] JSON Parse warning, formatting output:', err.message);
      throw new Error(`Failed to parse Gemini response: ${rawJson.slice(0, 200)}`);
    }

    dossier.brand = brand;
    dossier.generatedAt = new Date().toISOString();
    return dossier;
  }

  /**
   * 2. Synthesize Broadcast Audio for Each Scene via MsEdgeTTS
   */
  static async synthesizeSceneAudio(dossier, campaignDir) {
    console.log(`[APEX Omni Studio] Synthesizing neural broadcast voice (${dossier.voice})...`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(dossier.voice || 'hi-IN-MadhurNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const sceneAudioPaths = [];
    const sceneDurations = [];

    for (const scene of dossier.scenes) {
      const audioPath = path.join(campaignDir, `scene_${scene.scene_id}_audio.mp3`);
      await tts.toFile(campaignDir, scene.speech_text);
      
      // msedge-tts outputs to campaignDir/audio.mp3, rename it
      const tempAudio = path.join(campaignDir, 'audio.mp3');
      if (fs.existsSync(tempAudio)) {
        fs.copyFileSync(tempAudio, audioPath);
        fs.unlinkSync(tempAudio);
      }

      // Measure duration with ffmpeg
      const dur = this.getAudioDuration(audioPath);
      sceneAudioPaths.push(audioPath);
      sceneDurations.push(dur);
      console.log(`  ✓ Scene ${scene.scene_id} [${scene.beat}]: ${dur.toFixed(2)}s -> ${scene.speech_text.slice(0, 40)}...`);
    }

    return { sceneAudioPaths, sceneDurations };
  }

  /**
   * Helper: Get audio duration in seconds using ffmpeg
   */
  static getAudioDuration(audioPath) {
    const res = spawnSync(FFMPEG_PATH, ['-i', audioPath], { encoding: 'utf8' });
    const match = (res.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const mins = parseFloat(match[2]);
      const secs = parseFloat(match[3]);
      return hours * 3600 + mins * 60 + secs;
    }
    // Fallback: estimate from filesize (approx 6 KB/s for 48kbps MP3)
    const stats = fs.statSync(audioPath);
    return Math.max(stats.size / 6000, 3.5);
  }

  /**
   * 3. Generate High-Performance 60FPS Kinetic Canvas Motion HTML
   */
  static generateMotionCanvasHtml(brandKey, dossier, sceneStartTimes, totalDur) {
    const brand = dossier.brand;
    
    // Read and base64 encode brand visual assets if they exist
    let exteriorB64 = '';
    let interiorB64 = '';
    let rackB64 = '';
    
    if (brandKey === 'CarChuno') {
      if (fs.existsSync(brand.assetExterior)) exteriorB64 = fs.readFileSync(brand.assetExterior).toString('base64');
      if (fs.existsSync(brand.assetInterior)) interiorB64 = fs.readFileSync(brand.assetInterior).toString('base64');
    } else if (brandKey === 'CloseTesters') {
      if (fs.existsSync(brand.assetRack)) rackB64 = fs.readFileSync(brand.assetRack).toString('base64');
      else if (fs.existsSync(brand.assetMain)) rackB64 = fs.readFileSync(brand.assetMain).toString('base64');
    } else if (brandKey === 'AstroMasterpiece') {
      if (fs.existsSync(brand.assetSanctum)) exteriorB64 = fs.readFileSync(brand.assetSanctum).toString('base64');
      if (fs.existsSync(brand.assetPalm)) interiorB64 = fs.readFileSync(brand.assetPalm).toString('base64');
      if (fs.existsSync(brand.assetHavan)) rackB64 = fs.readFileSync(brand.assetHavan).toString('base64');
    }

    // Cumulative timing breakpoints
    const t0 = 0;
    const t1 = sceneStartTimes[1];
    const t2 = sceneStartTimes[2];
    const t3 = sceneStartTimes[3];
    const t4 = sceneStartTimes[4];
    const t5 = totalDur;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; overflow: hidden; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
  canvas { display: block; width: 1080px; height: 1920px; }
</style>
</head>
<body>
<canvas id="c" width="1080" height="1920"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const TOTAL_DUR = ${totalDur.toFixed(2)};
const FPS = 60;
const T1 = ${t1.toFixed(2)};
const T2 = ${t2.toFixed(2)};
const T3 = ${t3.toFixed(2)};
const T4 = ${t4.toFixed(2)};
const T5 = ${t5.toFixed(2)};

const BRAND_NAME = ${JSON.stringify(brand.brandName)};
const TAGLINE = ${JSON.stringify(brand.tagline)};
const PRIMARY_COLOR = "${brand.primaryColor}";
const ACCENT_COLOR = "${brand.accentColor}";

const SCENES = ${JSON.stringify(dossier.scenes)};

// Preload Images
let imgExterior = null;
let imgInterior = null;
let imgRack = null;

${exteriorB64 ? `imgExterior = new Image(); imgExterior.src = "data:image/png;base64,${exteriorB64}";` : ''}
${interiorB64 ? `imgInterior = new Image(); imgInterior.src = "data:image/png;base64,${interiorB64}";` : ''}
${rackB64 ? `imgRack = new Image(); imgRack.src = "data:image/png;base64,${rackB64}";` : ''}

// Kinetic Particles
const particles = [];
for (let i = 0; i < 90; i++) {
  particles.push({
    x: Math.random() * 1080,
    y: Math.random() * 1920,
    radius: Math.random() * 2.5 + 0.5,
    speedY: Math.random() * 1.8 + 0.4,
    alpha: Math.random() * 0.7 + 0.3
  });
}

function drawAtmosphere(t, theme) {
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  if (theme === 'dark_alert') {
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    grad.addColorStop(0, '#1E0507');
    grad.addColorStop(0.5, 'rgb(' + (40 + pulse * 35) + ', 8, 12)');
    grad.addColorStop(1, '#080002');
  } else if (theme === 'cosmic_gold') {
    grad.addColorStop(0, '#0F0B18');
    grad.addColorStop(0.5, '#2A1A05');
    grad.addColorStop(1, '#05070D');
  } else if (theme === 'cyber_tech') {
    grad.addColorStop(0, '#060B18');
    grad.addColorStop(0.5, '#0B1736');
    grad.addColorStop(1, '#03050B');
  } else {
    // Luxury Carbon
    grad.addColorStop(0, '#0B0B10');
    grad.addColorStop(0.5, '#161622');
    grad.addColorStop(1, '#050508');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Particles
  ctx.save();
  for (const p of particles) {
    p.y -= p.speedY;
    if (p.y < 0) p.y = 1920;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'dark_alert' ? 'rgba(255, 30, 39, ' + (p.alpha * 0.6) + ')' :
                    theme === 'cosmic_gold' ? 'rgba(255, 215, 0, ' + (p.alpha * 0.7) + ')' :
                    'rgba(56, 189, 248, ' + (p.alpha * 0.7) + ')';
    ctx.fill();
  }
  ctx.restore();

  // Bottom Cyber Grid
  ctx.save();
  ctx.strokeStyle = theme === 'dark_alert' ? 'rgba(255, 30, 39, 0.15)' : 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1.5;
  const gridOffset = (t * 70) % 60;
  for (let y = 1450; y < 1920; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y + gridOffset);
    ctx.lineTo(1080, y + gridOffset);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrandHeader() {
  ctx.save();
  // Glassmorphic top bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(40, 60, 1000, 100);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 60, 1000, 100);

  // Brand Name
  ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText(BRAND_NAME, 70, 125);

  // Verified Badge
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText("● OFFICIAL VERIFIED", 1000, 122);
  ctx.restore();
}

/**
 * Auto-wrapping & auto-scaling headline renderer (Strict 900px safe zone)
 * NEVER clips words outside canvas
 */
function drawFittedHeadline(text, yPos, color = '#FFFFFF', baseSize = 48, maxW = 900) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let fontSize = baseSize;
  ctx.font = '900 ' + fontSize + 'px "Plus Jakarta Sans", sans-serif';
  let measuredW = ctx.measureText(text).width;

  if (measuredW > maxW) {
    const words = text.split(' ');
    if (words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');

      const w1 = ctx.measureText(line1).width;
      const w2 = ctx.measureText(line2).width;
      const longest = Math.max(w1, w2);
      if (longest > maxW) {
        fontSize = Math.floor(baseSize * (maxW / longest));
        ctx.font = '900 ' + fontSize + 'px "Plus Jakarta Sans", sans-serif';
      }

      const lineSpacing = fontSize * 1.25;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = color;

      ctx.strokeText(line1, 540, yPos - lineSpacing / 2);
      ctx.fillText(line1, 540, yPos - lineSpacing / 2);

      ctx.strokeText(line2, 540, yPos + lineSpacing / 2);
      ctx.fillText(line2, 540, yPos + lineSpacing / 2);
      ctx.restore();
      return;
    } else {
      fontSize = Math.floor(baseSize * (maxW / measuredW));
      ctx.font = '900 ' + fontSize + 'px "Plus Jakarta Sans", sans-serif';
    }
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 24;
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = color;
  ctx.strokeText(text, 540, yPos);
  ctx.fillText(text, 540, yPos);
  ctx.restore();
}

/**
 * Smart Subtitle Wrap & Highlight Engine
 * Strictly keeps all words inside 860px width
 */
function drawHormoziCaptions(text, highlights, yPos = 1620) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = 38;
  ctx.font = '900 ' + fontSize + 'px "Plus Jakarta Sans", sans-serif';

  // Smart width-based word wrapping (strict max 860px width)
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? (currentLine + ' ' + word) : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > 860 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 52;
  let startY = yPos - ((lines.length - 1) * lineHeight) / 2;

  for (const line of lines) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 7;
    ctx.strokeText(line, 540, startY);

    const isHighlight = highlights && highlights.some(h => line.toLowerCase().includes(h.toLowerCase()));
    ctx.fillStyle = isHighlight ? ACCENT_COLOR : '#FFFFFF';
    ctx.fillText(line, 540, startY);
    startY += lineHeight;
  }
  ctx.restore();
}

function drawMetricCard(label, val, x = 140, y = 1200, w = 800, h = 180) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PRIMARY_COLOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'center';
  ctx.fillText(label.toUpperCase(), x + w/2, y + 55);

  ctx.font = '900 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = ACCENT_COLOR;
  ctx.fillText(val, x + w/2, y + 135);
  ctx.restore();
}

// Scene 1: Hook
function renderScene1(t) {
  drawAtmosphere(t, 'dark_alert');
  drawBrandHeader();

  drawFittedHeadline(SCENES[0].screen_headline, 480, '#FF1E27', 50, 900);

  // Display Center Image or Radar
  if (imgExterior && imgExterior.complete) {
    ctx.save();
    ctx.drawImage(imgExterior, 140, 640, 800, 480);
    ctx.restore();
  }

  drawMetricCard(SCENES[0].metric_label, SCENES[0].metric_value, 140, 1240);
  drawHormoziCaptions(SCENES[0].speech_text, SCENES[0].highlight_words, 1620);
}

// Scene 2: Agitation / Problem
function renderScene2(t) {
  drawAtmosphere(t, 'dark_alert');
  drawBrandHeader();

  drawFittedHeadline(SCENES[1].screen_headline, 480, '#F43F5E', 50, 900);

  // Problem Graphic HUD
  ctx.save();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(180, 620, 720, 500);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
  ctx.fillRect(180, 620, 720, 500);

  ctx.font = '900 72px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FF3B30';
  ctx.textAlign = 'center';
  ctx.fillText("⚠ HIDDEN TRAP", 540, 870);
  ctx.restore();

  drawMetricCard(SCENES[1].metric_label, SCENES[1].metric_value, 140, 1240);
  drawHormoziCaptions(SCENES[1].speech_text, SCENES[1].highlight_words, 1620);
}

// Scene 3: Solution Breakthrough
function renderScene3(t) {
  drawAtmosphere(t, 'luxury_carbon');
  drawBrandHeader();

  drawFittedHeadline(SCENES[2].screen_headline, 480, ACCENT_COLOR, 50, 900);

  // 360 showcase render or interior
  if (imgInterior && imgInterior.complete) {
    ctx.save();
    ctx.drawImage(imgInterior, 100, 600, 880, 520);
    ctx.restore();
  } else if (imgRack && imgRack.complete) {
    ctx.save();
    ctx.drawImage(imgRack, 100, 600, 880, 520);
    ctx.restore();
  }

  drawMetricCard(SCENES[2].metric_label, SCENES[2].metric_value, 140, 1240);
  drawHormoziCaptions(SCENES[2].speech_text, SCENES[2].highlight_words, 1620);
}

// Scene 4: Proof & Metrics
function renderScene4(t) {
  drawAtmosphere(t, 'cyber_tech');
  drawBrandHeader();

  drawFittedHeadline(SCENES[3].screen_headline, 480, '#38BDF8', 50, 900);

  // Animated Speedometer / Progress Arc
  ctx.save();
  ctx.translate(540, 820);
  ctx.beginPath();
  ctx.arc(0, 0, 180, Math.PI * 0.75, Math.PI * 2.25);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 24;
  ctx.stroke();

  ctx.beginPath();
  const fillEnd = Math.PI * 0.75 + (Math.PI * 1.5 * ((t - T3) / (T4 - T3)));
  ctx.arc(0, 0, 180, Math.PI * 0.75, fillEnd);
  ctx.strokeStyle = PRIMARY_COLOR;
  ctx.lineWidth = 24;
  ctx.stroke();

  ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText("100% PROOF", 0, 18);
  ctx.restore();

  drawMetricCard(SCENES[3].metric_label, SCENES[3].metric_value, 140, 1240);
  drawHormoziCaptions(SCENES[3].speech_text, SCENES[3].highlight_words, 1620);
}

// Scene 5: Outro & Call to Action
function renderScene5(t) {
  drawAtmosphere(t, 'cosmic_gold');
  drawBrandHeader();

  drawFittedHeadline(SCENES[4].screen_headline, 500, '#FFFFFF', 50, 900);

  // Big CTA Box
  ctx.save();
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.fillRect(120, 740, 840, 150);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 740, 840, 150);

  let ctaText = "BOOK ON WHATSAPP: +91 91313 65866";
  if (BRAND_NAME.includes('CarChuno')) ctaText = "COMPARE & BOOK ON CARCHUNO.COM";
  else if (BRAND_NAME.includes('CloseTesters')) ctaText = "LAUNCH APP ON CLOSETESTERS.COM";

  drawFittedHeadline(ctaText, 815, '#FFFFFF', 36, 800);
  ctx.restore();

  drawMetricCard(SCENES[4].metric_label, SCENES[4].metric_value, 140, 1140);
  drawHormoziCaptions(SCENES[4].speech_text, SCENES[4].highlight_words, 1600);
}

let startTime = null;
function render(timestamp) {
  if (!startTime) startTime = timestamp;
  const t = (timestamp - startTime) / 1000;

  if (t < T1) renderScene1(t);
  else if (t < T2) renderScene2(t);
  else if (t < T3) renderScene3(t);
  else if (t < T4) renderScene4(t);
  else renderScene5(t);

  if (t <= TOTAL_DUR + 0.4) {
    requestAnimationFrame(render);
  } else {
    console.log('[*] Kinetic canvas animation completed.');
  }
}

requestAnimationFrame(render);

// MediaRecorder setup for Chrome headless capture
const stream = canvas.captureStream(FPS);
const recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp8',
  videoBitsPerSecond: 25000000
});
const chunks = [];
recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  const reader = new FileReader();
  reader.onload = () => {
    window.recordedBase64 = reader.result.split(',')[1];
    window.isDone = true;
  };
  reader.readAsDataURL(blob);
};

recorder.start();
setTimeout(() => {
  recorder.stop();
}, Math.ceil((TOTAL_DUR + 0.5) * 1000));
</script>
</body>
</html>
    `;
  }

  /**
   * 4. Record Kinetic Canvas via Headless Chrome WebSocket CDP
   */
  static async recordCanvasToWebm(htmlPath, totalDur, outputWebm) {
    console.log(`[APEX Omni Studio] Recording 60FPS kinetic canvas via Chrome CDP (Duration: ${totalDur.toFixed(2)}s)...`);
    const port = 9399;
    const tempProfile = `C:\\Users\\HP\\AppData\\Local\\Temp\\chrome_apex_${port}`;

    const chromeProcess = spawn(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tempProfile}`,
      'file:///' + htmlPath.replace(/\\/g, '/')
    ]);

    let wsUrl = null;
    for (let i = 0; i < 35; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const data = await res.json();
        const page = data.find(d => d.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) {
      try { chromeProcess.kill(); } catch (e) {}
      throw new Error('Failed to attach to Chrome CDP WebSocket');
    }

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });

    let base64Data = null;
    const maxSteps = Math.ceil((totalDur + 5) * 2);
    for (let step = 0; step < maxSteps; step++) {
      await new Promise(r => setTimeout(r, 500));
      const evalRes = await send('Runtime.evaluate', { expression: 'window.isDone ? window.recordedBase64 : null' });
      if (evalRes && evalRes.result && evalRes.result.value) {
        base64Data = evalRes.result.value;
        console.log('\n[APEX Omni Studio] Canvas recording completed!');
        break;
      }
    }

    ws.close();
    try { chromeProcess.kill(); } catch (e) {}

    if (!base64Data) {
      throw new Error('Canvas recording timed out without receiving video buffer.');
    }

    fs.writeFileSync(outputWebm, Buffer.from(base64Data, 'base64'));
    const sizeMb = (fs.statSync(outputWebm).size / (1024 * 1024)).toFixed(2);
    console.log(`[APEX Omni Studio] Raw WebM saved: ${outputWebm} (${sizeMb} MB)`);
    return outputWebm;
  }

  /**
   * 5. Compile Master Audio & Video with FFmpeg
   */
  static compileMasterVideo(rawWebm, sceneAudioFiles, voiceDelays, totalDur, finalMp4Path) {
    console.log(`[APEX Omni Studio] Compiling Master H.264 60FPS Video with Audio & SFX...`);

    const ambientDrone = path.join(ASSETS_DIR, 'ambient_drone.mp3');
    const boomSfx = path.join(SFX_DIR, 'sub_bass_drop.wav');
    const whooshSfx = path.join(SFX_DIR, 'whoosh.wav');
    const blipSfx = path.join(SFX_DIR, 'blip.wav');
    const chimeSfx = path.join(SFX_DIR, 'victory_chime.wav');

    // FFmpeg filter complex
    // Inputs:
    // 0: rawWebm
    // 1-5: scene voices
    // 6: ambient drone
    // 7: boom
    // 8: whoosh
    // 9: blip
    // 10: chime
    const filterComplex = `
      [1:a]adelay=${voiceDelays[0]}|${voiceDelays[0]},volume=1.1[v1];
      [2:a]adelay=${voiceDelays[1]}|${voiceDelays[1]},volume=1.1[v2];
      [3:a]adelay=${voiceDelays[2]}|${voiceDelays[2]},volume=1.1[v3];
      [4:a]adelay=${voiceDelays[3]}|${voiceDelays[3]},volume=1.1[v4];
      [5:a]adelay=${voiceDelays[4]}|${voiceDelays[4]},volume=1.1[v5];
      [v1][v2][v3][v4][v5]amix=inputs=5:dropout_transition=0,volume=1.3[all_voice];

      [6:a]volume=0.10,afade=t=in:st=0:d=0.5,afade=t=out:st=${(totalDur - 1.5).toFixed(1)}:d=1.2[drone];

      [7:a]adelay=0|0,volume=0.5[sfx_boom1];
      [8:a]adelay=${Math.max(voiceDelays[1] - 300, 0)}|${Math.max(voiceDelays[1] - 300, 0)},volume=0.5[sfx_whoosh1];
      [9:a]adelay=${voiceDelays[2]}|${voiceDelays[2]},volume=0.3[sfx_blip1];
      [8:a]adelay=${Math.max(voiceDelays[3] - 300, 0)}|${Math.max(voiceDelays[3] - 300, 0)},volume=0.5[sfx_whoosh2];
      [10:a]adelay=${voiceDelays[4]}|${voiceDelays[4]},volume=0.6[sfx_chime];

      [sfx_boom1][sfx_whoosh1][sfx_blip1][sfx_whoosh2][sfx_chime]amix=inputs=5:dropout_transition=0[all_sfx];

      [all_voice][drone][all_sfx]amix=inputs=3:duration=first:dropout_transition=0,afade=t=out:st=${(totalDur - 1.0).toFixed(1)}:d=0.8[final_audio];

      [0:v]fps=60,scale=1080:1920,fade=t=in:st=0:d=0.3,fade=t=out:st=${(totalDur - 0.8).toFixed(1)}:d=0.8[final_video]
    `;

    const args = [
      '-y',
      '-i', rawWebm,
      '-i', sceneAudioFiles[0],
      '-i', sceneAudioFiles[1],
      '-i', sceneAudioFiles[2],
      '-i', sceneAudioFiles[3],
      '-i', sceneAudioFiles[4],
      '-stream_loop', '-1', '-i', ambientDrone,
      '-i', boomSfx,
      '-i', whooshSfx,
      '-i', blipSfx,
      '-i', chimeSfx,
      '-t', `${totalDur.toFixed(2)}`,
      '-filter_complex', filterComplex,
      '-map', '[final_video]',
      '-map', '[final_audio]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-profile:v', 'high',
      '-level', '4.2',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '256k',
      finalMp4Path
    ];

    const res = spawnSync(FFMPEG_PATH, args, { stdio: 'inherit' });
    if (res.status === 0 && fs.existsSync(finalMp4Path)) {
      const finalSizeMb = (fs.statSync(finalMp4Path).size / (1024 * 1024)).toFixed(2);
      console.log(`[APEX Omni Studio] 🏆 Master video exported successfully! (${finalSizeMb} MB)`);
      return finalMp4Path;
    } else {
      throw new Error(`FFmpeg export failed with status code: ${res.status}`);
    }
  }

  /**
   * Master Execution Entrypoint
   */
  static async runFullProduction(brandKey = 'CarChuno', customPrompt = '') {
    console.log('='.repeat(75));
    console.log(`⚡ APEX OMNI STUDIO: COMMENCING FULL AUTONOMOUS PRODUCTION FOR [${brandKey.toUpperCase()}]`);
    console.log('='.repeat(75));

    const timestamp = Date.now();
    const campaignDir = path.join(RENDERS_DIR, `${brandKey}_${timestamp}`);
    fs.mkdirSync(campaignDir, { recursive: true });

    // 1. Brainstorm dynamic dossier
    const dossier = await this.generateCampaignDossier(brandKey, customPrompt);
    fs.writeFileSync(path.join(campaignDir, 'campaign_dossier.json'), JSON.stringify(dossier, null, 2), 'utf8');

    // 2. Synthesize audio for 5 scenes
    const { sceneAudioPaths, sceneDurations } = await this.synthesizeSceneAudio(dossier, campaignDir);

    // Dynamic Anti-Clipping Pacing Architecture:
    // 450ms breathing space between scenes so speech never collides
    // 2.5s outro buffer at end for CTA visibility, contact details and zero speech truncation
    const SCENE_GAP = 0.45;
    const OUTRO_BUFFER = 2.5;

    let cumulativeTime = 0;
    const sceneStartTimes = [];
    const voiceDelays = [];
    for (let i = 0; i < sceneDurations.length; i++) {
      sceneStartTimes.push(cumulativeTime);
      voiceDelays.push(Math.round(cumulativeTime * 1000));
      cumulativeTime += sceneDurations[i] + SCENE_GAP;
    }
    const totalDur = cumulativeTime + OUTRO_BUFFER;

    // 3. Generate Kinetic HTML Canvas (Pass EXACT sceneStartTimes array, not sceneDurations!)
    const htmlContent = this.generateMotionCanvasHtml(brandKey, dossier, sceneStartTimes, totalDur);
    const motionHtmlPath = path.join(campaignDir, 'motion.html');
    fs.writeFileSync(motionHtmlPath, htmlContent, 'utf8');

    // 4. Record Canvas to WebM
    const rawWebmPath = path.join(campaignDir, 'raw_motion.webm');
    await this.recordCanvasToWebm(motionHtmlPath, totalDur, rawWebmPath);

    // 5. Compile Master Video
    const finalMp4Path = path.join(campaignDir, `${brandKey}_Masterpiece_60FPS.mp4`);
    this.compileMasterVideo(rawWebmPath, sceneAudioPaths, voiceDelays, totalDur, finalMp4Path);

    // Replicate to Promotion Video Desktop folder
    const promotionBrandDir = path.join('C:', 'Users', 'HP', 'Desktop', 'Promotion Video', brandKey);
    if (!fs.existsSync(promotionBrandDir)) fs.mkdirSync(promotionBrandDir, { recursive: true });
    
    const desktopMp4 = path.join(promotionBrandDir, `${brandKey}_Apex_Masterpiece_60FPS.mp4`);
    fs.copyFileSync(finalMp4Path, desktopMp4);
    fs.copyFileSync(path.join(campaignDir, 'campaign_dossier.json'), path.join(promotionBrandDir, 'latest_campaign_dossier.json'));

    console.log('\n' + '='.repeat(75));
    console.log(`🏆 APEX PRODUCTION COMPLETE:`);
    console.log(`📁 Local Render: ${finalMp4Path}`);
    console.log(`📁 Desktop Copy: ${desktopMp4}`);
    console.log(`🎬 YouTube Title: ${dossier.youtube_metadata.title}`);
    console.log(`🏷️ Tags: ${dossier.youtube_metadata.tags.slice(0, 5).join(', ')}...`);
    console.log('='.repeat(75) + '\n');

    return {
      brand: brandKey,
      campaignDir,
      finalMp4Path,
      desktopMp4,
      dossier
    };
  }
}

module.exports = ApexOmniStudioEngine;

// Self test if executed directly
if (require.main === module) {
  const brand = process.argv[2] || 'CarChuno';
  ApexOmniStudioEngine.runFullProduction(brand)
    .then(res => console.log('[✓] Studio run succeeded.'))
    .catch(err => console.error('[!] Studio run failed:', err));
}

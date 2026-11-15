const fs = require('fs');
const filePath = 'C:/Users/HP/Desktop/carchuno-sales-engine/server.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('safety_guardrails')) {
  const target = "const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');";
  const addition = `const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Strict Anti-Ban & Safety Guardrails (Zero-Ban Tolerance Policy)
const { SAFETY_POLICY, AntiBanController } = require('./safety_guardrails');
const GeminiKeyRotator = require('./gemini_rotator');
const geminiRotator = new GeminiKeyRotator();
`;
  content = content.replace(target, addition);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Attached safety_guardrails and Gemini rotator to server.js');
} else {
  console.log('Already attached.');
}

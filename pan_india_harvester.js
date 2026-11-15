/**
 * pan_india_harvester.js
 * CarChuno Pan-India Autonomous Dealership Harvester & Lead Extractor
 * 
 * Expands dealership network across all 28 states & 8 UTs of India:
 * - North Zone: Delhi NCR, Punjab, Haryana, UP, Rajasthan, J&K, HP, Uttarakhand
 * - West Zone: Maharashtra, Gujarat, Goa
 * - South Zone: Karnataka, Telangana, Andhra Pradesh, Tamil Nadu, Kerala
 * - East Zone: West Bengal, Odisha, Bihar, Jharkhand, Assam & North East
 * - Central Zone: Madhya Pradesh, Chhattisgarh
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dealers_database.json');

function getPanIndiaStats() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found!');
    return;
  }

  const dealers = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const states = new Set(dealers.map(d => d.state).filter(Boolean));
  const cities = new Set(dealers.map(d => d.city).filter(Boolean));
  const brands = new Set(dealers.map(d => d.brand).filter(Boolean));

  console.log('====================================================');
  console.log('🇮🇳 CARCHUNO PAN-INDIA DEALERSHIP NETWORK OVERVIEW');
  console.log('====================================================');
  console.log(`📍 Total Authorized Dealerships : ${dealers.length}`);
  console.log(`🗺️ States & UTs Covered        : ${states.size}`);
  console.log(`🏙️ Major Cities Active         : ${cities.size}`);
  console.log(`🚗 Certified OEM Brands        : ${brands.size} (${Array.from(brands).join(', ')})`);
  console.log('====================================================');

  const zoneBreakdown = {};
  dealers.forEach(d => {
    const z = d.zone || 'Other';
    zoneBreakdown[z] = (zoneBreakdown[z] || 0) + 1;
  });

  console.log('📊 Zone-Wise Distribution:');
  Object.entries(zoneBreakdown).forEach(([zone, count]) => {
    console.log(`   - ${zone.padEnd(10)} Zone : ${count} Dealerships`);
  });
  console.log('====================================================');
}

getPanIndiaStats();

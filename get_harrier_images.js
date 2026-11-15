const https = require('https');

const url = 'https://www.carwale.com/tata-cars/harrier/images/';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const matches = data.match(/https:\/\/imgd\.aeplcdn\.com\/[^\s"'<>\\]+/g) || [];
    const harrier = [...new Set(matches.map(u => u.replace(/&amp;/g, '&')))];
    console.log('=== HARRIER EXTERIOR ===');
    harrier.filter(u => u.includes('harrier') && u.includes('exterior')).slice(0, 15).forEach(u => console.log(u));
  });
});

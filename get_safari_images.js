const https = require('https');

const url = 'https://www.carwale.com/tata-cars/safari/images/';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const matches = data.match(/https:\/\/imgd\.aeplcdn\.com\/[^\s"'<>\\]+/g) || [];
    const safari = [...new Set(matches.map(u => u.replace(/&amp;/g, '&')))];
    const dash = safari.filter(u => u.includes('dashboard') || u.includes('steering') || u.includes('cabin') || u.includes('front-seats'));
    console.log('Dash images:');
    dash.forEach(u => console.log(u));
  });
});

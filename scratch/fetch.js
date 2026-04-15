const https = require('https');
https.get('https://nhatruyen.site/the-loai', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const matches = data.match(/class="([^"]+)"/g) || [];
        const uniques = [...new Set(matches.map(m => m.replace(/class="/, '').replace(/"/, '')))];
        console.log("\n=== Common Classes ===");
        console.log(uniques.join(', '));

        const itemMatches = data.match(/<article[^>]*>.*?<\/article>|<div[^>]*class="[^"]*item[^"]*"[^>]*>.*?<\/div>/gis) || [];
        console.log("\n=== Item Count ===");
        console.log("Found: " + itemMatches.length);
        if (itemMatches.length > 0) {
            console.log("\n=== First Item ===");
            console.log(itemMatches[0].substring(0, 500));
        }

        const titleMatches = data.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gis) || [];
        console.log("\n=== Titles ===");
        console.log(titleMatches.slice(0, 10).join('\n'));
    });
}).on('error', err => console.error(err));

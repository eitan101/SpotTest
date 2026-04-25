import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/VITE_TEMP_SPOTIFY_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

async function verify() {
    console.log("Testing token:", token ? token.substring(0, 10) + "..." : "MISSING");
    if (!token) return;

    const queries = ['top hits', 'year:2023', 'Queen'];
    for (const q of queries) {
        console.log(`\nSearching for: ${q}`);
        try {
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log(`Status: ${res.status}`);
            const data = await res.json();
            if (res.ok) {
                console.log(`Found ${data.tracks.items.length} tracks.`);
                let previews = 0;
                data.tracks.items.forEach(t => {
                    if (t.preview_url) previews++;
                    console.log(`- ${t.name} by ${t.artists[0].name} (Preview: ${t.preview_url ? 'YES' : 'NO'})`);
                });
                console.log(`Total previews in this batch: ${previews}`);
            } else {
                console.log("Error:", JSON.stringify(data));
            }
        } catch (e) {
            console.error("Fetch failed:", e.message);
        }
    }
}

verify();

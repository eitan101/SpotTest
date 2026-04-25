import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/VITE_TEMP_SPOTIFY_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : null;

async function test() {
    console.log("Testing Spotify with market=US...");
    const res1 = await fetch(`https://api.spotify.com/v1/search?q=queen&type=track&limit=5&market=US`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data1 = await res1.json();
    let previews = 0;
    data1.tracks.items.forEach(t => { if (t.preview_url) previews++; });
    console.log(`Spotify market=US previews: ${previews} / 5`);

    console.log("\nTesting iTunes API fallback...");
    const artist = "Queen";
    const track = "Bohemian Rhapsody";
    const res2 = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist + " " + track)}&entity=song&limit=1`);
    const data2 = await res2.json();
    if (data2.results.length > 0) {
        console.log(`iTunes Preview URL: ${data2.results[0].previewUrl}`);
    } else {
        console.log("iTunes API found no results.");
    }
}
test();

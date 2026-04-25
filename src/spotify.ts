const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin + window.location.pathname;

export async function redirectToAuthCodeFlow() {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("response_type", "code");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("scope", "user-read-private user-read-email streaming app-remote-control user-modify-playback-state user-read-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

export async function fetchTracks(token: string): Promise<any[]> {
    console.log("Starting fetchTracks (Search Mode) with token:", token.substring(0, 10) + "...");
    
    const queries = [
        'year:1970-1979',
        'year:1980-1989',
        'year:1990-1999',
        'year:2000-2009',
        'year:2010-2019',
        'year:2020-2024'
    ];
    
    const allTracks: any[] = [];
    
    for (const q of queries) {
        try {
            console.log(`Searching for: ${q}`);
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`, {
                method: "GET", 
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Search failed for ${q}:`, response.status, errorData);
                continue;
            }

            const data = await response.json();
            if (data.tracks && data.tracks.items) {
                const validTracks = data.tracks.items.filter((t: any) => t && t.id && t.album && t.album.release_date);
                console.log(`Found ${validTracks.length} tracks for ${q}`);
                allTracks.push(...validTracks);
            }
        } catch (e) {
            console.error("Search exception for query", q, e);
        }
    }
    
    // Deduplicate
    const unique = Array.from(new Map(allTracks.map(t => [t.id, t])).values());
    console.log(`Total unique tracks found: ${unique.length}`);

    // Return everything we found since Web Playback SDK plays full tracks!
    return unique;
}

export async function playTrack(token: string, deviceId: string, trackUri: string) {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri] })
    });
    if (!response.ok && response.status !== 204) {
        const err = await response.json().catch(() => ({}));
        console.error("Play request failed", response.status, err);
    }
}

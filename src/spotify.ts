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
    params.append("scope", "user-read-private user-read-email");
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
    const playlistIds = [
        '37i9dQZF1DXcBWIGoYBM3M', // Today's Top Hits
        '37i9dQZF1DX4UtSsGTpSno', // 60s
        '37i9dQZF1DXaKIArc0GqRy', // 80s
        '37i9dQZF1DX0JKuGyExSZZ', // 70s
        '37i9dQZF1DXbTxeuPH60LR', // 90s
        '37i9dQZF1DX4o3oZnmoaxn', // 2000s
        '37i9dQZF1DX5Ejj0EkURtP', // All Out 2010s
        '37i9dQZF1DX4JpneCYUI7z', // Global Hits
    ];
    
    const allTracks: any[] = [];
    
    for (const id of playlistIds) {
        try {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`, {
                method: "GET", 
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.items) {
                const validTracks = data.items
                    .map((item: any) => item.track)
                    .filter((t: any) => t && t.preview_url && t.album && t.album.release_date);
                allTracks.push(...validTracks);
            }
        } catch (e) {
            console.error("Failed to fetch playlist", id, e);
        }
    }
    
    // Remove duplicates
    const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());
    return uniqueTracks;
}

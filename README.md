# Hitster Clone 🎵

A web-based clone of the popular music trivia game **Hitster**. Listen to songs via Spotify and guess exactly where they belong in a chronological timeline based on their original release date!

## How to Play

1. **Login:** Log in using your Spotify Premium account.
2. **Listen:** The game will play a mystery song using a hidden background player.
3. **Guess:** Place the mystery song into the correct spot in your timeline by clicking the `+` buttons between existing songs.
4. **Survive:** You start with 5 lives. An incorrect guess costs you 1 life. Survive as long as you can to get a high score!

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Vanilla CSS (`App.css`)
- **API Integration:** Spotify Web API (Data fetching)
- **Audio Playback:** Spotify Web Playback SDK (Premium streaming)
- **Testing:** Puppeteer (Headless E2E testing)
- **Deployment:** GitHub Pages (via GitHub Actions)

---

## Code Architecture

This application is a **100% Client-Side Single Page Application (SPA)**. It does not require a custom backend server.

### Key Components:

*   **`src/App.tsx`:** The core game loop. Manages state (lives, score, timeline tracks, current track), player initialization, and game logic (verifying timeline placement).
*   **`src/spotify.ts`:** Handles all Spotify communications:
    *   **Authentication (PKCE Flow):** Implements the Proof Key for Code Exchange (PKCE) flow to securely authenticate users directly from the browser without needing a backend secret.
    *   **Data Fetching:** Searches and retrieves tracks by decades.
    *   **Playback Control:** Sends commands to the Web Playback SDK to play specific tracks.
*   **Spotify Web Playback SDK:** A script loaded at runtime that creates a virtual Spotify Connect device inside the browser tab, allowing us to stream full audio tracks without showing the Spotify UI (which would reveal the answers!).

---

## Local Development

To run this project locally, you will need a Spotify Developer app setup.

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://localhost:5173/
```

### 2. Run the Dev Server

```bash
npm install
npm run dev
```

### 3. "Local Dev Bypass" Workflow

Spotify tokens expire after 1 hour. To prevent having to log in constantly during local development, the app supports a token bypass:

1. Go to your **production URL** and log in.
2. Scroll to the footer and click **"Copy Token"**.
3. Paste this token into your local `.env` file like this:
   `VITE_TEMP_SPOTIFY_TOKEN=BQ...`
4. The local Vite server will automatically bypass the login screen and use this token!

---

## Testing

The project includes basic End-to-End (E2E) testing and API verification scripts using Puppeteer and Node.js.

*   `node test_app.js`: Launches a headless browser to ensure the app loads, bypasses login (if the env token is present), and renders the game UI correctly.
*   `node test_playback.js`: Tests the interaction with the Spotify Web Playback SDK's Play/Pause controls.
*   `node verify_token.js`: A diagnostic script to verify if a Spotify token is valid and can successfully fetch tracks.

---

## Deployment

The application is automatically deployed to **GitHub Pages** using GitHub Actions.

*   **Workflow:** `.github/workflows/deploy.yml`
*   **Trigger:** Pushing to the `main` branch.
*   **Process:** The action builds the Vite app into static assets and uploads them directly to the GitHub Pages environment.

**Important Deployment Note:** GitHub Pages URLs are strictly case-sensitive. Ensure your Spotify Developer Dashboard's *Redirect URI* matches the exact casing of your repository URL (e.g., `https://eitan101.github.io/SpotTest/`).

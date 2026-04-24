# Hitster Clone

A web-based game where you guess the chronological order of songs using the Spotify API.

## How to Play

1. Login with your Spotify account.
2. A random song will play.
3. Place it on the timeline relative to other songs (before or after).
4. If you're correct, your score increases and you keep going!

## Setup

1. Create an app on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Get your **Client ID**.
3. Add `http://localhost:5173/` and your GitHub Pages URL to the **Redirect URIs** in your Spotify app settings.
4. Create a `.env` file in the root directory and add:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   VITE_REDIRECT_URI=http://localhost:5173/
   ```

## Deployment to GitHub Pages

1. Push this code to a GitHub repository.
2. Go to the repository settings -> Secrets and variables -> Actions.
3. Add the following secrets:
   - `VITE_SPOTIFY_CLIENT_ID`: Your Spotify Client ID.
   - `VITE_REDIRECT_URI`: Your GitHub Pages URL (e.g., `https://username.github.io/repo-name/`).
4. Ensure GitHub Pages is set to deploy from GitHub Actions in settings -> Pages.

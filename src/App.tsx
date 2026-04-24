import { useEffect, useState, useRef } from 'react';
import { Track } from './types';
import { redirectToAuthCodeFlow, getAccessToken, fetchTracks } from './spotify';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeline, setTimeline] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setLoading(true);
      getAccessToken(code)
        .then(t => {
          setToken(t);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          console.error("Auth error:", err);
          setError("Failed to get access token from Spotify.");
        })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchTracks(token)
        .then(data => {
          if (data.length === 0) {
            setError("No tracks found with previews. Check your Spotify settings.");
            return;
          }
          const shuffled = data.sort(() => 0.5 - Math.random());
          setTracks(shuffled);
          
          const first = shuffled.pop();
          const second = shuffled.pop();
          
          if (first && second) {
            setTimeline([first]);
            setCurrentTrack(second);
          }
        })
        .catch(err => {
          console.error("Fetch error:", err);
          setError("Failed to fetch tracks from Spotify.");
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const handleGuess = (index: number) => {
    if (!currentTrack || revealed) return;

    const newTimeline = [...timeline];
    newTimeline.splice(index, 0, currentTrack);

    const isCorrect = checkPlacement(newTimeline);

    if (isCorrect) {
      setTimeline(newTimeline);
      setScore(score + 1);
      setRevealed(true);
      setTimeout(() => {
        setRevealed(false);
        const next = tracks.pop();
        if (next) {
          setCurrentTrack(next);
        } else {
          setGameOver(true);
        }
      }, 2000);
    } else {
      setRevealed(true);
      setGameOver(true);
    }
  };

  const checkPlacement = (newTimeline: Track[]) => {
    for (let i = 0; i < newTimeline.length - 1; i++) {
      const dateA = new Date(newTimeline[i].album.release_date).getTime();
      const dateB = new Date(newTimeline[i+1].album.release_date).getTime();
      if (dateA > dateB) return false;
    }
    return true;
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="login-screen">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => window.location.href = window.location.pathname}>Try Again</button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="login-screen">
          <h1>Loading...</h1>
          <p>Connecting to Spotify...</p>
        </div>
      );
    }

    if (!token) {
      return (
        <div className="login-screen">
          <h1>Hitster Clone</h1>
          <p>Guess the chronological order of songs!</p>
          <button onClick={redirectToAuthCodeFlow}>Login with Spotify</button>
        </div>
      );
    }

    if (gameOver) {
      return (
        <div className="game-over">
          <h1>Game Over!</h1>
          <p>Your score: {score}</p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      );
    }

    return (
      <div className="app">
        <header>
          <div className="score">Score: {score}</div>
        </header>

        <main>
          <div className="timeline">
            <button className="drop-zone" onClick={() => handleGuess(0)}>+</button>
            {timeline.map((track, i) => (
              <div key={track.id} className="track-container">
                <div className="track-card">
                  <img src={track.album.images[0].url} alt={track.name} />
                  <div className="track-info">
                    <div className="name">{track.name}</div>
                    <div className="artist">{track.artists[0].name}</div>
                    <div className="year">{new Date(track.album.release_date).getFullYear()}</div>
                  </div>
                </div>
                <button className="drop-zone" onClick={() => handleGuess(i + 1)}>+</button>
              </div>
            ))}
          </div>

          {currentTrack && (
            <div className="current-track">
              <h2>Current Song</h2>
              <div className={`track-card mystery ${revealed ? 'revealed' : ''}`}>
                {revealed ? (
                  <>
                    <img src={currentTrack.album.images[0].url} alt={currentTrack.name} />
                    <div className="track-info">
                      <div className="name">{currentTrack.name}</div>
                      <div className="artist">{currentTrack.artists[0].name}</div>
                      <div className="year">{new Date(currentTrack.album.release_date).getFullYear()}</div>
                    </div>
                  </>
                ) : (
                  <div className="mystery-content">?</div>
                )}
              </div>
              <audio 
                ref={audioRef} 
                src={currentTrack.preview_url || ''} 
                autoPlay 
                controls 
              />
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <div className="layout-container">
      {renderContent()}
      <footer>
        <div className="version">v1.0.2</div>
      </footer>
    </div>
  );
}

export default App;

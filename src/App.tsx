import { useEffect, useState } from 'react';
import { Track } from './types';
import { redirectToAuthCodeFlow, getAccessToken, fetchTracks, playTrack } from './spotify';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(import.meta.env.VITE_TEMP_SPOTIFY_TOKEN || null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [timeline, setTimeline] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);

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
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Hitster Clone Web Player',
        getOAuthToken: (cb: (token: string) => void) => { cb(token); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setPlayerReady(true);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setPlayerReady(false);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        // Hide loader when we have a valid state and it's playing our current track
        if (state.track_window?.current_track) {
          setIsLoadingTrack(false);
        }
      });

      player.connect();
    };

    return () => {
      // Cleanup if needed
    };
  }, [token]);

  useEffect(() => {
    if (currentTrack && deviceId && token) {
      setIsLoadingTrack(true);
      playTrack(token, deviceId, currentTrack.uri).catch(err => {
        console.error("Failed to play track via Spotify Connect", err);
        setIsLoadingTrack(false);
      });
    }
  }, [currentTrack, deviceId, token]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchTracks(token)
        .then(data => {
          if (data.length === 0) {
            setError("No tracks found. This might be due to API restrictions.");
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

  const nextSong = () => {
    setRevealed(false);
    setShowNextButton(false);
    setIsLoadingTrack(true);
    const next = tracks.pop();
    if (next) {
      setCurrentTrack(next);
    } else {
      setGameOver(true);
      setIsLoadingTrack(false);
    }
  };

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
        nextSong();
      }, 2000);
    } else {
      setRevealed(true);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives > 0) {
        setShowNextButton(true);
      } else {
        setTimeout(() => {
          setGameOver(true);
        }, 2000);
      }
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

  const getProxyImageUrl = (url: string) => {
    if (url.includes('i.scdn.co')) {
      return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }
    return url;
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
        <header style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 20px', boxSizing: 'border-box' }}>
          <div className="lives" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4444' }}>
            Lives: {'❤️'.repeat(lives)}
          </div>
          <div className="score" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1DB954' }}>
            Score: {score}
          </div>
        </header>

        <main>
          <div className="timeline">
            <button className="drop-zone" onClick={() => handleGuess(0)}>+</button>
            {timeline.map((track, i) => (
              <div key={track.id} className="track-container">
                <div className="track-card">
                  <img src={getProxyImageUrl(track.album.images[0].url)} alt={track.name} />
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
                {isLoadingTrack && (
                  <div className="loader-overlay">
                    <div className="spinner"></div>
                    <p>Loading Track...</p>
                  </div>
                )}
                {revealed ? (
                  <>
                    <img src={getProxyImageUrl(currentTrack.album.images[0].url)} alt={currentTrack.name} />
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

              <div className="player-controls" style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                {!playerReady ? (
                  <p style={{ color: '#aaa' }}>Initializing Premium Player...</p>
                ) : (
                  <>
                    <button 
                      onClick={() => player?.togglePlay()}
                      disabled={isLoadingTrack}
                      style={{ 
                        padding: '12px 24px', 
                        fontSize: '1.2rem', 
                        cursor: isLoadingTrack ? 'not-allowed' : 'pointer', 
                        borderRadius: '30px', 
                        background: isLoadingTrack ? '#555' : '#1DB954', 
                        color: 'white', 
                        border: 'none',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        opacity: isLoadingTrack ? 0.7 : 1
                      }}
                    >
                      {isPlaying ? '⏸ Pause' : '▶️ Play'}
                    </button>
                    {showNextButton && (
                      <button 
                        onClick={nextSong}
                        style={{ 
                          padding: '10px 20px', 
                          fontSize: '1rem', 
                          cursor: 'pointer', 
                          borderRadius: '20px', 
                          background: '#ff4444', 
                          color: 'white', 
                          border: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        Next Song ⏭
                      </button>
                    )}
                  </>
                )}
              </div>
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
        <div className="version" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          v1.0.6
          {token && (
            <button 
              style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} 
              onClick={() => {
                navigator.clipboard.writeText(token);
                alert("Token copied!");
              }}
            >
              Copy Token
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;

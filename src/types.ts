export interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
    release_date: string;
  };
  preview_url: string | null;
}

export interface GameState {
  timeline: Track[];
  currentTrack: Track | null;
  score: number;
  gameOver: boolean;
}

/**
 * SoundWave Browse Controller
 * Provides Spotify-class curated feeds, charts, categories, and lyrics.
 */

const FEATURED_CATEGORIES = [
  { id: 'pop', name: 'Pop', color: '#8c1932', gradient: ['#8c1932', '#d82b42'], icon: '🔥' },
  { id: 'hiphop', name: 'Hip-Hop', color: '#ba5d07', gradient: ['#ba5d07', '#f77737'], icon: '🎤' },
  { id: 'dance', name: 'Dance & EDM', color: '#148a08', gradient: ['#148a08', '#22c55e'], icon: '⚡' },
  { id: 'indie', name: 'Indie & Alt', color: '#1e3264', gradient: ['#1e3264', '#3b82f6'], icon: '🎸' },
  { id: 'rnb', name: 'R&B & Soul', color: '#7358ff', gradient: ['#7358ff', '#a855f7'], icon: '✨' },
  { id: 'rock', name: 'Rock Classics', color: '#b02897', gradient: ['#b02897', '#ec4899'], icon: '🤘' },
  { id: 'chill', name: 'Chill & Relax', color: '#477d95', gradient: ['#477d95', '#06b6d4'], icon: '☕' },
  { id: 'workout', name: 'Workout Energy', color: '#e91429', gradient: ['#e91429', '#f97316'], icon: '🏋️' },
  { id: 'focus', name: 'Deep Focus', color: '#503750', gradient: ['#503750', '#8b5cf6'], icon: '🎧' },
  { id: 'sleep', name: 'Sleep & Ambient', color: '#1e3264', gradient: ['#1e3264', '#1e293b'], icon: '🌙' },
  { id: 'gaming', name: 'Gaming Beats', color: '#e8115b', gradient: ['#e8115b', '#f43f5e'], icon: '🎮' },
  { id: 'romance', name: 'Love & Romance', color: '#8d67ab', gradient: ['#8d67ab', '#d946ef'], icon: '💖' },
];

const CURATED_FEED = {
  quickAccess: [
    {
      id: 'liked-songs',
      title: 'Liked Songs',
      type: 'special',
      cover: 'https://misc.scdn.co/liked-songs/liked-songs-640.png',
      gradient: ['#450af5', '#8e8ee5'],
    },
    {
      id: 'daily-mix-1',
      title: 'Daily Mix 1',
      subtitle: 'The Weeknd, Drake & more',
      type: 'mix',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    },
    {
      id: 'daily-mix-2',
      title: 'Daily Mix 2',
      subtitle: 'Daft Punk, Justice & more',
      type: 'mix',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    },
    {
      id: 'top-50-global',
      title: 'Today\'s Top Hits',
      subtitle: 'The hottest tracks right now',
      type: 'playlist',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    },
    {
      id: 'chill-tracks',
      title: 'Chill Lounge',
      subtitle: 'Kick back & unwind',
      type: 'playlist',
      cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop',
    },
    {
      id: 'workout-heat',
      title: 'Beast Mode',
      subtitle: 'High energy pump',
      type: 'playlist',
      cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop',
    },
  ],
  madeForYou: [
    {
      id: 'mfy-1',
      title: 'Daily Mix 1',
      subtitle: 'The Weeknd, Metro Boomin, Travis Scott',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      color: '#4f46e5',
    },
    {
      id: 'mfy-2',
      title: 'Daily Mix 2',
      subtitle: 'Daft Punk, Dua Lipa, Calvin Harris',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
      color: '#06b6d4',
    },
    {
      id: 'mfy-3',
      title: 'Release Radar',
      subtitle: 'Catch all latest releases from artists you follow',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      color: '#10b981',
    },
    {
      id: 'mfy-4',
      title: 'Discover Weekly',
      subtitle: 'Your weekly mixtape of fresh music',
      cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
      color: '#8b5cf6',
    },
  ],
  topCharts: [
    {
      id: 'chart-1',
      title: 'Global Top 50',
      subtitle: 'Most played tracks across the globe right now',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      badge: 'TOP 50',
    },
    {
      id: 'chart-2',
      title: 'Viral 50 - Global',
      subtitle: 'The most viral tracks right now',
      cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop',
      badge: 'VIRAL',
    },
    {
      id: 'chart-3',
      title: 'Hip-Hop Hotlist',
      subtitle: 'Biggest rap & trap bangers',
      cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop',
      badge: 'TRENDING',
    },
  ],
  popularArtists: [
    {
      id: 'art-1',
      name: 'The Weeknd',
      type: 'Artist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      monthlyListeners: '106,842,109',
    },
    {
      id: 'art-2',
      name: 'Taylor Swift',
      type: 'Artist',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      monthlyListeners: '98,214,032',
    },
    {
      id: 'art-3',
      name: 'Drake',
      type: 'Artist',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      monthlyListeners: '84,119,720',
    },
    {
      id: 'art-4',
      name: 'Billie Eilish',
      type: 'Artist',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      monthlyListeners: '79,480,915',
    },
    {
      id: 'art-5',
      name: 'Daft Punk',
      type: 'Artist',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
      monthlyListeners: '35,120,400',
    },
  ],
  moodPlaylists: [
    {
      id: 'mood-1',
      title: 'Late Night Drives',
      subtitle: 'Atmospheric electronic & moody pop',
      cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop',
    },
    {
      id: 'mood-2',
      title: 'Deep Focus',
      subtitle: 'Keep calm and focus with ambient study beats',
      cover: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop',
    },
    {
      id: 'mood-3',
      title: 'Peaceful Piano',
      subtitle: 'Relax and indulge with beautiful piano pieces',
      cover: 'https://images.unsplash.com/photo-1520523839898-50712704043b?w=400&h=400&fit=crop',
    },
    {
      id: 'mood-4',
      title: 'Energy Booster',
      subtitle: 'Uplifting pop & dance anthems to jumpstart your day',
      cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop',
    },
  ],
};

/**
 * Controller handlers
 */
const getFeaturedFeed = async (req, res) => {
  try {
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      feed: CURATED_FEED,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch featured feed', message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    return res.json({
      success: true,
      categories: FEATURED_CATEGORIES,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
  }
};

const getLyrics = async (req, res) => {
  try {
    const { id } = req.params;
    const title = req.query.title || 'SoundWave Track';
    const artist = req.query.artist || 'SoundWave Artist';

    // Generates synchronized karaoke-style or scrolling lyrics
    const sampleLyrics = [
      { time: 0, text: `♪ Instrumental Intro ♪` },
      { time: 12, text: `Ooh, yeah, I've been running through the night` },
      { time: 24, text: `Looking for a signal, searching for the light` },
      { time: 36, text: `Can you hear the music playing in the dark?` },
      { time: 48, text: `SoundWave in your soul, lighting up a spark` },
      { time: 60, text: `♪ Chorus ♪` },
      { time: 65, text: `Feel the rhythm taking over every beat` },
      { time: 78, text: `Electric frequencies moving underneath your feet` },
      { time: 92, text: `Never let it go, never fade away` },
      { time: 105, text: `We belong to the SoundWave today` },
      { time: 120, text: `♪ Guitar Solo & Breakdown ♪` },
      { time: 140, text: `Yeah, we belong to the SoundWave today` },
    ];

    return res.json({
      success: true,
      trackId: id,
      title,
      artist,
      synced: true,
      lines: sampleLyrics,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch lyrics', message: error.message });
  }
};

module.exports = {
  getFeaturedFeed,
  getCategories,
  getLyrics,
};


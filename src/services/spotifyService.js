import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

const CLIENT_ID = '34e975fc7b334c0489eb399171bd9bdd';
const CLIENT_SECRET = 'dad484ed3bc74a0992f093725300701b'; 

export const getAccessToken = async () => {
  try {
    const savedToken = await SecureStore.getItemAsync('spotify_token');
    const expiresAt = await SecureStore.getItemAsync('spotify_token_expires');
    const now = Date.now();
    if (savedToken && expiresAt && now < parseInt(expiresAt)) return savedToken;

    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${authString}` } }
    );
    const token = response.data.access_token;
    const expiresIn = response.data.expires_in;
    await SecureStore.setItemAsync('spotify_token', token);
    await SecureStore.setItemAsync('spotify_token_expires', String(now + (expiresIn - 60) * 1000));
    return token;
  } catch (error) {
    console.log('SPOTIFY TOKEN ERROR:', error.response?.data || error.message);
    return null;
  }
};

export const getArtistTopTracks = async (artistName) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(artistName)}&type=track&limit=6&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.tracks.items.slice(0, 3);
  } catch (error) {
    console.log('TOP TRACKS ERROR:', error.response?.data || error.message);
    return [];
  }
};

export const getArtistInfo = async (artistId) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

// Busca la cancion en Deezer y devuelve { preview, deezerUrl, deezerTrackId, cover }
export const getDeezerTrack = async (trackName, artistName) => {
  try {
    const query = encodeURIComponent(`${trackName} ${artistName}`);
    const response = await axios.get(`https://api.deezer.com/search?q=${query}&limit=5`);
    const results = response.data.data;
    if (!results || results.length === 0) return null;

    const artistLower = artistName.toLowerCase();
    const match = results.find(r =>
      r.artist?.name?.toLowerCase().includes(artistLower) ||
      artistLower.includes(r.artist?.name?.toLowerCase())
    );
    const track = match || results[0];
    return {
      preview: track?.preview || null,
      deezerUrl: track?.link || null,
      deezerTrackId: track?.id || null,
      cover: track?.album?.cover_big || null,
    };
  } catch (error) {
    console.log('DEEZER TRACK ERROR:', error.message);
    return null;
  }
};

// Compatibilidad con código anterior
export const getDeezerPreview = async (trackName, artistName) => {
  const result = await getDeezerTrack(trackName, artistName);
  return result?.preview || null;
};
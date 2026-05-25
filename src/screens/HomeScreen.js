import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Image, StyleSheet, Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import axios from 'axios';
import { getAccessToken } from '../services/spotifyService';

function WaveIcon({ size = 'sm' }) {
  const bars = size === 'sm'
    ? [
        { h: 10, c: '#3b8bfa', o: 0.7 }, { h: 14, c: '#3b8bfa', o: 1 },
        { h: 8,  c: '#1DB954', o: 0.85 }, { h: 16, c: '#1DB954', o: 1 },
        { h: 11, c: '#3b8bfa', o: 0.8 }, { h: 6,  c: '#1DB954', o: 0.6 },
      ]
    : [
        { h: 14, c: '#3b8bfa', o: 0.7 }, { h: 20, c: '#3b8bfa', o: 1 },
        { h: 11, c: '#1DB954', o: 0.85 }, { h: 22, c: '#1DB954', o: 1 },
        { h: 15, c: '#3b8bfa', o: 0.8 }, { h: 8,  c: '#1DB954', o: 0.6 },
      ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {bars.map((b, i) => (
        <View key={i} style={{ width: size === 'sm' ? 3 : 4, height: b.h, backgroundColor: b.c, opacity: b.o, borderRadius: 2 }} />
      ))}
    </View>
  );
}

const EXPLORE_CARDS = [
  { label: 'Canciones', emoji: '🎵', bg: 'rgba(29,185,84,0.12)',   type: 'track' },
  { label: 'Artistas',  emoji: '🎤', bg: 'rgba(255,190,80,0.12)',  type: 'artist' },
  { label: 'Álbumes',   emoji: '💿', bg: 'rgba(180,180,200,0.1)', type: 'album' },
];

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchSongs = async () => {
    const term = search.trim();
    if (!term) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) { Alert.alert('Error de autenticación', 'No se pudo obtener el token.'); return; }
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(term)}&type=track&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSongs(response.data.tracks.items);
    } catch (error) {
      Alert.alert('Error al buscar', error.response?.data?.error?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}><WaveIcon size="md" /></View>
        <Text style={styles.appName}>MELODIFY</Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>¿Qué quieres buscar?</Text>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Artista, canción o álbum..."
            placeholderTextColor="#666"
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={searchSongs}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={searchSongs} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.searchBtnText}>Buscar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {songs.length === 0 && !loading && (
        <View style={styles.exploreSection}>
          <Text style={styles.exploreLabel}>Explora:</Text>
          <View style={styles.exploreGrid}>
            {EXPLORE_CARDS.map((card) => (
              <TouchableOpacity key={card.type} style={styles.exploreCard} onPress={() => { setSearch(card.label); }}>
                <View style={[styles.exploreIcon, { backgroundColor: card.bg }]}>
                  <Text style={{ fontSize: 24 }}>{card.emoji}</Text>
                </View>
                <Text style={styles.exploreCardName}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Details', { item, allSongs: songs, currentIndex: index })}>
            <Image source={{ uri: item.album.images[0]?.url }} style={styles.thumb} />
            <View style={styles.cardInfo}>
              <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{item.artists[0].name}</Text>
              <Text style={styles.albumName} numberOfLines={1}>{item.album.name}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Busca una canción para comenzar 🎶</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 28, gap: 12 },
  iconBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#0d2235', borderWidth: 1.5, borderColor: 'rgba(59,139,250,0.35)', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b8bfa', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  appName: { color: '#1DB954', fontSize: 20, fontWeight: '800', letterSpacing: 5, textShadowColor: 'rgba(29,185,84,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  searchSection: { marginBottom: 24, gap: 10 },
  searchLabel: { color: '#aaa', fontSize: 13, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a24', color: '#fff', padding: 14, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  searchBtn: { backgroundColor: '#1DB954', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: 76 },
  searchBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  exploreSection: { marginBottom: 20, gap: 12 },
  exploreLabel: { color: '#888', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  exploreGrid: { flexDirection: 'row', gap: 10 },
  exploreCard: { flex: 1, backgroundColor: '#1a1a24', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8 },
  exploreIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exploreCardName: { color: '#ccc', fontSize: 11, fontWeight: '500' },
  card: { backgroundColor: '#1a1a24', borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  thumb: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
  cardInfo: { flex: 1 },
  songName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  artistName: { color: '#1DB954', fontSize: 13, marginTop: 3 },
  albumName: { color: '#666', fontSize: 11, marginTop: 2 },
  arrow: { color: '#444', fontSize: 22, marginLeft: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#444', fontSize: 15, textAlign: 'center' },
});
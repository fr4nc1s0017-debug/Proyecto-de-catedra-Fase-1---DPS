import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [voiceUris, setVoiceUris] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const voicePlayer = useAudioPlayer(null);

  useFocusEffect(useCallback(() => { loadFavorites(); }, []));

  const loadFavorites = async () => {
    try {
      const data = await AsyncStorage.getItem('favorites');
      const list = data ? JSON.parse(data) : [];
      setFavorites(list);
      const uris = {};
      await Promise.all(list.map(async (song) => {
        const uri = await AsyncStorage.getItem(`voice_${song.id}`);
        if (uri) uris[song.id] = uri;
      }));
      setVoiceUris(uris);
    } catch (e) { console.log('FAVORITES ERROR:', e); }
  };

  const removeFavorite = async (songId) => {
    Alert.alert('Eliminar favorito', '¿Quitar esta canción de favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: async () => {
          const updated = favorites.filter(f => f.id !== songId);
          setFavorites(updated);
          await AsyncStorage.setItem('favorites', JSON.stringify(updated));
          await AsyncStorage.removeItem(`voice_${songId}`);
          const u = { ...voiceUris }; delete u[songId]; setVoiceUris(u);
      }},
    ]);
  };

  const playVoice = (songId) => {
    const uri = voiceUris[songId];
    if (!uri) return;
    try { voicePlayer.replace({ uri }); voicePlayer.play(); setPlayingId(songId); }
    catch (e) { console.log('PLAY VOICE ERROR:', e); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>♥</Text>
          <Text style={styles.emptyText}>No tienes canciones favoritas aún.{'\n'}¡Explora y guarda tus favoritas!</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const hasVoice = !!voiceUris[item.id];
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Details', { item })} onLongPress={() => removeFavorite(item.id)}>
                <Image source={{ uri: item.album.images[0]?.url }} style={styles.thumb} />
                <View style={styles.info}>
                  <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.artistName} numberOfLines={1}>{item.artists[0].name}</Text>
                  <Text style={styles.albumName} numberOfLines={1}>{item.album.name}</Text>
                  {hasVoice && <Text style={styles.voiceBadge}>🎤 Nota de voz</Text>}
                </View>
                <View style={styles.actions}>
                  {hasVoice && (
                    <TouchableOpacity style={[styles.voiceBtn, playingId === item.id && styles.voiceBtnActive]} onPress={() => playVoice(item.id)}>
                      <Text style={styles.voiceBtnText}>▶</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.heart}>♥</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
      {favorites.length > 0 && <Text style={styles.hint}>Mantén presionado para eliminar</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20, paddingTop: 60 },
  title: { color: '#1DB954', fontSize: 28, fontWeight: '800', marginBottom: 24, letterSpacing: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  card: { backgroundColor: '#1a1a24', borderRadius: 14, marginBottom: 10, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  thumb: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
  info: { flex: 1 },
  songName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  artistName: { color: '#1DB954', fontSize: 13, marginTop: 3 },
  albumName: { color: '#666', fontSize: 11, marginTop: 2 },
  voiceBadge: { color: '#7B68EE', fontSize: 10, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceBtn: { backgroundColor: '#22222e', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: '#1DB954' },
  voiceBtnText: { color: '#fff', fontSize: 12 },
  heart: { color: '#E53935', fontSize: 20 },
  hint: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 10, marginBottom: 10 },
});
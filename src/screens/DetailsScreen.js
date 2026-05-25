import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { getArtistTopTracks, getArtistInfo, getDeezerTrack } from '../services/spotifyService';

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route, navigation }) {

  const { item, allSongs = [], currentIndex = 0 } = route.params;

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [isFavorite, setIsFavorite] = useState(false);
  const [topTracks, setTopTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [artistInfo, setArtistInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(true);

  // Nota de voz
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUri, setVoiceUri] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voicePlayer = useAudioPlayer(voiceUri ? { uri: voiceUri } : null);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allSongs.length - 1;
  const isPlaying = status?.playing ?? false;
  const position = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;

  useEffect(() => {
    saveToHistory();
    checkIfFavorite();
    loadArtistData();
    fetchDeezerAudio();
    loadVoiceNote();
    return () => {
      try { player.pause(); } catch (_) {}
    };
  }, []);

  useEffect(() => {
    if (previewUrl) {
      player.replace({ uri: previewUrl });
    }
  }, [previewUrl]);

  const fetchDeezerAudio = async () => {
    setLoadingAudio(true);
    try {
      const result = await getDeezerTrack(item.name, item.artists[0].name);
      if (result?.preview) setPreviewUrl(result.preview);
    } catch (e) {
      console.log('DEEZER AUDIO ERROR:', e.message);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handlePlayPause = async () => {
    if (loadingAudio) { Alert.alert('Cargando', 'Buscando audio en Deezer, espera...'); return; }
    if (!previewUrl) { Alert.alert('Sin audio', 'No se encontro audio disponible.'); return; }
    try {
      if (isPlaying) { player.pause(); } else { player.play(); }
    } catch (error) {
      Alert.alert('Error de audio', 'No se pudo reproducir la cancion.');
    }
  };

  const seekTo = (ratio) => {
    if (!duration) return;
    try { player.seekTo(ratio * duration); } catch (_) {}
  };

  const goToPrev = () => {
    if (!hasPrev) return;
    try { player.pause(); } catch (_) {}
    navigation.replace('Details', { item: allSongs[currentIndex - 1], allSongs, currentIndex: currentIndex - 1 });
  };

  const goToNext = () => {
    if (!hasNext) return;
    try { player.pause(); } catch (_) {}
    navigation.replace('Details', { item: allSongs[currentIndex + 1], allSongs, currentIndex: currentIndex + 1 });
  };

  const saveToHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('history');
      let history = data ? JSON.parse(data) : [];
      history = history.filter(h => h.id !== item.id);
      history.unshift({ ...item, savedAt: new Date().toISOString() });
      if (history.length > 20) history = history.slice(0, 20);
      await AsyncStorage.setItem('history', JSON.stringify(history));
    } catch (error) { console.log('HISTORY ERROR:', error); }
  };

  const checkIfFavorite = async () => {
    try {
      const data = await AsyncStorage.getItem('favorites');
      const favorites = data ? JSON.parse(data) : [];
      setIsFavorite(favorites.some(f => f.id === item.id));
    } catch (error) { console.log('CHECK FAVORITE ERROR:', error); }
  };

  const loadArtistData = async () => {
    setLoadingTracks(true);
    const [tracks, info] = await Promise.all([
      getArtistTopTracks(item.artists[0].name),
      getArtistInfo(item.artists[0].id)
    ]);
    setTopTracks(tracks.filter(t => t.id !== item.id).slice(0, 3));
    setArtistInfo(info);
    setLoadingTracks(false);
  };

  const toggleFavorite = async () => {
    try {
      const data = await AsyncStorage.getItem('favorites');
      let favorites = data ? JSON.parse(data) : [];
      if (isFavorite) {
        favorites = favorites.filter(f => f.id !== item.id);
        // Borrar nota de voz asociada si existe
        await AsyncStorage.removeItem(`voice_${item.id}`);
        setIsFavorite(false);
        setVoiceUri(null);
        Alert.alert('Eliminado', 'Cancion quitada de favoritos.');
      } else {
        favorites.push(item);
        setIsFavorite(true);
        Alert.alert('Guardado', 'Cancion agregada a favoritos!');
      }
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) { console.log('FAVORITE ERROR:', error); }
  };

  // ── Nota de voz ──────────────────────────────────────────
  const loadVoiceNote = async () => {
    try {
      const uri = await AsyncStorage.getItem(`voice_${item.id}`);
      if (uri) setVoiceUri(uri);
    } catch (e) { console.log('LOAD VOICE ERROR:', e); }
  };

  const handleRecord = async () => {
    // Pedir permiso de micrófono
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso al microfono para grabar tu nota de voz.');
      return;
    }

    if (isRecording) {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setIsRecording(false);
      if (uri) {
        setVoiceUri(uri);
        await AsyncStorage.setItem(`voice_${item.id}`, uri);
        // Si aun no es favorito, agregarlo automáticamente
        if (!isFavorite) {
          const data = await AsyncStorage.getItem('favorites');
          let favorites = data ? JSON.parse(data) : [];
          favorites.push(item);
          await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
          setIsFavorite(true);
          Alert.alert('Nota guardada', 'Nota de voz guardada. Cancion agregada a Favoritos automaticamente.');
        } else {
          Alert.alert('Nota guardada', 'Tu nota de voz quedo guardada en esta cancion.');
        }
      }
    } else {
      try { player.pause(); } catch (_) {}
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    }
  };

  const handlePlayVoice = () => {
    if (!voiceUri) return;
    try {
      voicePlayer.play();
      setIsPlayingVoice(true);
    } catch (e) { console.log('PLAY VOICE ERROR:', e); }
  };

  const deleteVoiceNote = async () => {
    Alert.alert(
      'Borrar nota de voz',
      'Quieres eliminar la nota de voz de esta cancion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(`voice_${item.id}`);
            setVoiceUri(null);
          }
        }
      ]
    );
  };
  // ─────────────────────────────────────────────────────────

  const formatTime = (secs) => {
    const s = Math.floor(secs || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const getSongDescription = () => {
    const popularity = item.popularity || 0;
    const year = item.album.release_date?.substring(0, 4) || '';
    const totalTracks = item.album.total_tracks || 1;
    const trackNum = item.track_number || 1;
    const pop = popularity >= 80 ? 'muy popular globalmente' : popularity >= 50 ? 'con buena popularidad' : 'con seguidores fieles';
    const dur = item.duration_ms
      ? `${Math.floor(item.duration_ms / 60000)}:${String(Math.floor((item.duration_ms % 60000) / 1000)).padStart(2, '0')}`
      : null;
    let desc = `"${item.name}" es una cancion de ${item.artists.map(a => a.name).join(', ')} ${pop}`;
    if (year) desc += `, lanzada en ${year}`;
    desc += ` en el album "${item.album.name}"`;
    if (totalTracks > 1) desc += ` (pista ${trackNum} de ${totalTracks})`;
    if (dur) desc += `. Duracion: ${dur} min`;
    desc += '.';
    return desc;
  };

  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;
  const progressBarWidth = width - 72;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <TouchableOpacity style={styles.backButton} onPress={() => {
        try { player.pause(); } catch (_) {}
        navigation.goBack();
      }}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Image source={{ uri: item.album.images[0]?.url }} style={styles.image} />
      <Text style={styles.song}>{item.name}</Text>
      <Text style={styles.artist}>{item.artists.map(a => a.name).join(', ')}</Text>
      <Text style={styles.album}>{item.album.name}</Text>
      {artistInfo?.genres?.length > 0 && (
        <Text style={styles.genres}>{artistInfo.genres.slice(0, 3).join(' · ')}</Text>
      )}

      <View style={styles.deezerBadge}>
        <Text style={styles.deezerBadgeText}>🎵 Audio via Deezer (30 seg)</Text>
      </View>

      {/* REPRODUCTOR */}
      <View style={styles.playerCard}>
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressTrack}
            activeOpacity={0.8}
            onPress={(e) => {
              const ratio = e.nativeEvent.locationX / progressBarWidth;
              seekTo(Math.max(0, Math.min(1, ratio)));
            }}
          >
            <View style={[styles.progressFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
            <View style={[styles.progressThumb, { left: `${Math.round(progressRatio * 100)}%` }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{duration > 0 ? formatTime(duration) : '--:--'}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.skipBtn, !hasPrev && styles.skipBtnDisabled]} onPress={goToPrev} disabled={!hasPrev}>
            <Text style={[styles.skipIcon, !hasPrev && styles.skipIconDisabled]}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playBtn, loadingAudio && styles.playBtnLoading]} onPress={handlePlayPause} disabled={loadingAudio}>
            {loadingAudio
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={[styles.skipBtn, !hasNext && styles.skipBtnDisabled]} onPress={goToNext} disabled={!hasNext}>
            <Text style={[styles.skipIcon, !hasNext && styles.skipIconDisabled]}>⏭</Text>
          </TouchableOpacity>
        </View>

        {loadingAudio && <Text style={styles.loadingText}>🔍 Buscando audio en Deezer...</Text>}
        {!loadingAudio && !previewUrl && <Text style={styles.noAudioText}>⚠ Sin audio disponible</Text>}
      </View>

      {/* NOTA DE VOZ */}
      <View style={styles.voiceCard}>
        <Text style={styles.voiceTitle}>🎤 Tu nota de voz</Text>
        <Text style={styles.voiceSubtitle}>
          {voiceUri
            ? 'Grabaste una nota sobre esta cancion'
            : 'Graba lo que piensas de esta cancion, o tararear el ritmo'}
        </Text>
        <View style={styles.voiceButtons}>
          <TouchableOpacity
            style={[styles.voiceRecordBtn, isRecording && styles.voiceRecordBtnActive]}
            onPress={handleRecord}
          >
            <Text style={styles.voiceRecordBtnText}>
              {isRecording ? '⏹ Detener' : voiceUri ? '🎙 Regrabar' : '🎙 Grabar'}
            </Text>
          </TouchableOpacity>

          {voiceUri && !isRecording && (
            <TouchableOpacity style={styles.voicePlayBtn} onPress={handlePlayVoice}>
              <Text style={styles.voicePlayBtnText}>▶ Escuchar</Text>
            </TouchableOpacity>
          )}

          {voiceUri && !isRecording && (
            <TouchableOpacity style={styles.voiceDeleteBtn} onPress={deleteVoiceNote}>
              <Text style={styles.voiceDeleteBtnText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
        {isRecording && <Text style={styles.recordingIndicator}>● Grabando...</Text>}
      </View>

      {/* DESCRIPCION */}
      <View style={styles.descCard}>
        <Text style={styles.descTitle}>📖 Sobre esta cancion</Text>
        <Text style={styles.descText}>{getSongDescription()}</Text>
        {item.explicit && (
          <View style={styles.explicitBadge}>
            <Text style={styles.explicitText}>E  Contenido explicito</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
        onPress={toggleFavorite}
      >
        <Text style={styles.buttonText}>
          {isFavorite ? '♥  En Favoritos' : '♡  Guardar Favorito'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Mas de {item.artists[0].name}</Text>

      {loadingTracks ? (
        <ActivityIndicator color="#1DB954" style={{ marginVertical: 20 }} />
      ) : topTracks.length === 0 ? (
        <Text style={styles.noTracks}>No se encontraron canciones</Text>
      ) : (
        topTracks.map((track, index) => {
          const dur = track.duration_ms
            ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}`
            : null;
          return (
            <TouchableOpacity
              key={track.id}
              style={styles.trackCard}
              onPress={() => {
                try { player.pause(); } catch (_) {}
                navigation.push('Details', { item: track, allSongs, currentIndex });
              }}
            >
              <Text style={styles.trackNumber}>{index + 1}</Text>
              <Image source={{ uri: track.album.images[0]?.url }} style={styles.trackImage} />
              <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{track.artists[0].name}</Text>
                <Text style={styles.trackDesc} numberOfLines={1}>
                  {track.album.name}{dur ? ` · ${dur}` : ''}
                </Text>
              </View>
              <Text style={styles.trackArrow}>›</Text>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  backButton: { marginTop: 50, marginBottom: 10 },
  backText: { color: '#1DB954', fontSize: 16 },
  image: { width: '100%', height: 270, borderRadius: 20, marginBottom: 18 },
  song: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  artist: { color: '#1DB954', fontSize: 16, textAlign: 'center', marginTop: 5 },
  album: { color: '#999', fontSize: 13, textAlign: 'center', marginTop: 3 },
  genres: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 3, fontStyle: 'italic' },
  deezerBadge: { alignSelf: 'center', backgroundColor: '#1A2A1A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8, borderWidth: 1, borderColor: '#1DB954' },
  deezerBadgeText: { color: '#1DB954', fontSize: 11, fontWeight: '600' },
  playerCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  progressContainer: { marginBottom: 16 },
  progressTrack: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 8, position: 'relative', justifyContent: 'center' },
  progressFill: { height: 4, backgroundColor: '#1DB954', borderRadius: 2, position: 'absolute', left: 0 },
  progressThumb: { width: 12, height: 12, backgroundColor: '#fff', borderRadius: 6, position: 'absolute', marginLeft: -6, top: -4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#666', fontSize: 11 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  skipBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skipBtnDisabled: { opacity: 0.3 },
  skipIcon: { fontSize: 28, color: '#fff' },
  skipIconDisabled: { color: '#555' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1DB954', alignItems: 'center', justifyContent: 'center' },
  playBtnLoading: { backgroundColor: '#14833B' },
  playIcon: { fontSize: 28, color: '#000' },
  loadingText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 10 },
  noAudioText: { color: '#E53935', fontSize: 12, textAlign: 'center', marginTop: 10 },
  // Nota de voz
  voiceCard: { backgroundColor: '#1A1A2A', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  voiceTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  voiceSubtitle: { color: '#888', fontSize: 12, marginBottom: 12 },
  voiceButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  voiceRecordBtn: { backgroundColor: '#1DB954', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
  voiceRecordBtnActive: { backgroundColor: '#E53935' },
  voiceRecordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  voicePlayBtn: { backgroundColor: '#2A2A3A', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
  voicePlayBtnText: { color: '#ccc', fontSize: 13 },
  voiceDeleteBtn: { backgroundColor: '#2A1A1A', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9 },
  voiceDeleteBtnText: { fontSize: 15 },
  recordingIndicator: { color: '#E53935', fontSize: 12, marginTop: 8, fontWeight: '500' },
  // Descripcion
  descCard: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#1DB954' },
  descTitle: { color: '#1DB954', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  descText: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  explicitBadge: { marginTop: 8, backgroundColor: '#333', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  explicitText: { color: '#aaa', fontSize: 11 },
  favoriteButton: { backgroundColor: '#333', padding: 15, borderRadius: 12, marginBottom: 24 },
  favoriteButtonActive: { backgroundColor: '#5C0A0A' },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
  noTracks: { color: '#666', textAlign: 'center', marginVertical: 20 },
  trackCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 10, padding: 10, marginBottom: 10 },
  trackNumber: { color: '#999', fontSize: 13, width: 20, textAlign: 'center' },
  trackImage: { width: 50, height: 50, borderRadius: 6, marginHorizontal: 10 },
  trackInfo: { flex: 1 },
  trackName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  trackArtist: { color: '#1DB954', fontSize: 12, marginTop: 2 },
  trackDesc: { color: '#666', fontSize: 11, marginTop: 3 },
  trackArrow: { color: '#555', fontSize: 22, marginLeft: 8 },
});
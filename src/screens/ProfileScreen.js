import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, ScrollView, TextInput
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [recentSongs, setRecentSongs] = useState([]);
  const cameraRef = useRef(null);

  useFocusEffect(useCallback(() => { loadProfileData(); }, []));

  const loadProfileData = async () => {
    try {
      const photo    = await AsyncStorage.getItem('profile_photo');
      const name     = await AsyncStorage.getItem('profile_name');
      const email    = await AsyncStorage.getItem('profile_email');
      const histData = await AsyncStorage.getItem('history');
      if (photo) setPhotoUri(photo);
      if (name)  setUserName(name);
      if (email) setUserEmail(email);
      setRecentSongs(histData ? JSON.parse(histData).slice(0, 5) : []);
    } catch (e) { console.log('LOAD PROFILE ERROR:', e); }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos permiso de cámara para tomar tu foto de perfil.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setPhotoUri(photo.uri);
      setShowCamera(false);
      await AsyncStorage.setItem('profile_photo', photo.uri);
      Alert.alert('¡Listo!', 'Foto de perfil actualizada.');
    } catch (e) { console.log('CAMERA ERROR:', e); }
  };

  const saveName = async () => {
    try {
      await AsyncStorage.setItem('profile_name', tempName);
      setUserName(tempName);
      setEditingName(false);
    } catch (e) { console.log('SAVE NAME ERROR:', e); }
  };

  const saveEmail = async () => {
    try {
      await AsyncStorage.setItem('profile_email', tempEmail);
      setUserEmail(tempEmail);
      setEditingEmail(false);
    } catch (e) { console.log('SAVE EMAIL ERROR:', e); }
  };

  const clearProfile = () => {
    Alert.alert('Resetear perfil', '¿Quieres borrar tu foto, nombre y email?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('profile_photo');
          await AsyncStorage.removeItem('profile_name');
          await AsyncStorage.removeItem('profile_email');
          setPhotoUri(null);
          setUserName('');
          setUserEmail('');
      }},
    ]);
  };

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const day = d.getDate();
      const month = d.toLocaleString('es', { month: 'short' });
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${day}-${month} ${h}:${m}`;
    } catch { return ''; }
  };

  // ── Vista de cámara ──────────────────────────────────────
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
        <View style={styles.cameraTopBar}>
          <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setShowCamera(false)}>
            <Text style={styles.cameraCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Foto de perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.cameraBottomBar}>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Vista principal ──────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* HEADER con flecha y botón salir */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Perfil</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={clearProfile}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* AVATAR */}
      <TouchableOpacity onPress={handleOpenCamera} style={styles.avatarWrapper}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>📷</Text>
            <Text style={styles.avatarHint}>Toca para añadir foto</Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </TouchableOpacity>

      {/* NOMBRE editable */}
      {editingName ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={tempName}
            onChangeText={setTempName}
            placeholder="Tu nombre..."
            placeholderTextColor="#555"
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setTempName(userName); setEditingName(true); }}>
          <Text style={styles.userName}>
            {userName || 'Toca para agregar tu nombre'}
          </Text>
        </TouchableOpacity>
      )}

      {/* EMAIL editable */}
      {editingEmail ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={tempEmail}
            onChangeText={setTempEmail}
            placeholder="tu@email.com"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveEmail}>
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setTempEmail(userEmail); setEditingEmail(true); }}>
          <Text style={styles.userEmail}>
            {userEmail || 'Toca para agregar tu email'}
          </Text>
        </TouchableOpacity>
      )}

      {/* BADGES */}
      <View style={styles.badgesRow}>
        <View style={styles.badgeSpotify}>
          <Text style={styles.badgeSpotifyText}>♫  Spotify conectado</Text>
        </View>
        <View style={styles.badgePremium}>
          <Text style={styles.badgePremiumText}>★  Premium</Text>
        </View>
      </View>

      {/* ESCUCHADAS RECIENTEMENTE */}
      {recentSongs.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>♫  Escuchadas recientemente</Text>
          <View style={styles.recentGrid}>
            {recentSongs.map((song, i) => (
              <View key={`${song.id}-${i}`} style={styles.recentCard}>
                {song.album?.images?.[0]?.url
                  ? <Image source={{ uri: song.album.images[0].url }} style={styles.recentThumb} />
                  : <View style={[styles.recentThumb, { backgroundColor: '#22222e' }]} />
                }
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName} numberOfLines={1}>{song.name}</Text>
                  <Text style={styles.recentArtist} numberOfLines={1}>{song.artists?.[0]?.name}</Text>
                  {song.savedAt && (
                    <Text style={styles.recentTime}>{formatTimestamp(song.savedAt)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {recentSongs.length === 0 && (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyRecentText}>🎵 Aún no has escuchado canciones{'\n'}¡Busca una en Inicio!</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingTop: 56, paddingBottom: 20,
  },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#E53935', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  logoutText: { color: '#E53935', fontSize: 13, fontWeight: '600' },

  // Avatar
  avatarWrapper: { marginBottom: 16, position: 'relative' },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2.5, borderColor: '#1DB954',
  },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#1a1a24',
    borderWidth: 2, borderColor: 'rgba(29,185,84,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 32 },
  avatarHint: { color: '#555', fontSize: 10, marginTop: 4, textAlign: 'center', paddingHorizontal: 8 },
  editBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: '#1DB954', width: 26, height: 26,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
  },
  editBadgeText: { fontSize: 12 },

  // Nombre y email
  editRow: { flexDirection: 'row', gap: 10, marginBottom: 8, width: '100%', alignItems: 'center' },
  editInput: {
    flex: 1, backgroundColor: '#1a1a24', color: '#fff',
    padding: 12, borderRadius: 12, fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  saveBtn: { backgroundColor: '#1DB954', padding: 12, borderRadius: 12 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  userEmail: { color: '#aaa', fontSize: 13, marginBottom: 20, textAlign: 'center' },

  // Badges
  badgesRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  badgeSpotify: {
    borderWidth: 1.5, borderColor: '#1DB954', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  badgeSpotifyText: { color: '#1DB954', fontSize: 13, fontWeight: '600' },
  badgePremium: {
    borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  badgePremiumText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },

  // Recientes
  recentSection: { width: '100%' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  recentGrid: { gap: 10 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a1a24', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  recentThumb: { width: 52, height: 52, borderRadius: 10, flexShrink: 0 },
  recentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  recentArtist: { color: '#aaa', fontSize: 12, marginTop: 2 },
  recentTime: { color: '#555', fontSize: 11, marginTop: 3 },

  // Empty state
  emptyRecent: { marginTop: 40, alignItems: 'center' },
  emptyRecentText: { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Cámara
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraCloseBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraCloseText: { color: '#fff', fontSize: 16 },
  cameraTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cameraBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: 20,
  },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
});
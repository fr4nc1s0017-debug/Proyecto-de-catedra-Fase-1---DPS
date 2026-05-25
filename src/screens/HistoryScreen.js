import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('history');
      setHistory(data ? JSON.parse(data) : []);
    } catch (e) { console.log('HISTORY LOAD ERROR:', e); }
  };

  const clearHistory = () => {
    Alert.alert('Borrar historial', '¿Seguro que quieres borrar todo el historial?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('history'); setHistory([]);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearText}>Borrar todo</Text>
          </TouchableOpacity>
        )}
      </View>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🕐</Text>
          <Text style={styles.emptyText}>No has escuchado canciones aún.{'\n'}¡Busca una y aparecerá aquí!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Details', { item })}>
              <Text style={styles.num}>{index + 1}</Text>
              <Image source={{ uri: item.album.images[0]?.url }} style={styles.thumb} />
              <View style={styles.info}>
                <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.artistName} numberOfLines={1}>{item.artists[0].name}</Text>
                <Text style={styles.albumName} numberOfLines={1}>{item.album.name}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#1DB954', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  clearBtn: { backgroundColor: 'rgba(229,57,53,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(229,57,53,0.2)' },
  clearText: { color: '#E53935', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#555', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  card: { backgroundColor: '#1a1a24', borderRadius: 14, marginBottom: 10, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  num: { color: '#444', fontSize: 12, width: 22, textAlign: 'center', marginRight: 4 },
  thumb: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
  info: { flex: 1 },
  songName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  artistName: { color: '#1DB954', fontSize: 13, marginTop: 3 },
  albumName: { color: '#666', fontSize: 11, marginTop: 2 },
  arrow: { color: '#444', fontSize: 22, marginLeft: 6 },
});
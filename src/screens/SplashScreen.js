import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

function WaveIcon() {
  const bars = [
    { height: 20, color: '#3b8bfa', opacity: 0.7 },
    { height: 28, color: '#3b8bfa', opacity: 1 },
    { height: 16, color: '#1DB954', opacity: 0.85 },
    { height: 32, color: '#1DB954', opacity: 1 },
    { height: 22, color: '#3b8bfa', opacity: 0.8 },
    { height: 12, color: '#1DB954', opacity: 0.6 },
  ];
  return (
    <View style={icon.row}>
      {bars.map((b, i) => (
        <View key={i} style={[icon.bar, { height: b.height, backgroundColor: b.color, opacity: b.opacity }]} />
      ))}
    </View>
  );
}

const icon = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { width: 5, borderRadius: 3 },
});

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('MainTabs'), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glowBlue} />
      <View style={styles.glowGreen} />
      <View style={styles.iconBox}>
        <WaveIcon />
      </View>
      <Text style={styles.appName}>MELODIFY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center', gap: 24 },
  glowBlue: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,139,250,0.12)', top: '30%', left: '10%' },
  glowGreen: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(29,185,84,0.1)', top: '35%', right: '5%' },
  iconBox: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#0d2235', borderWidth: 1.5, borderColor: 'rgba(59,139,250,0.4)', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b8bfa', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  appName: { color: '#1DB954', fontSize: 32, fontWeight: '800', letterSpacing: 6, textShadowColor: 'rgba(29,185,84,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
});
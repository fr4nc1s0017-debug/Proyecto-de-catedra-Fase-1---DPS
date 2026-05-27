import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111118',
          borderTopColor: 'rgba(255,255,255,0.07)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
      }}
    >
      <Tab.Screen name="Inicio"    component={HomeScreen}      options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🔍</Text> }} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>♥</Text>  }} />
      <Tab.Screen name="Historial" component={HistoryScreen}   options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🕐</Text> }} />
      <Tab.Screen name="Perfil"    component={ProfileScreen}   options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text> }} />
    </Tab.Navigator>
  );
}
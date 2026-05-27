# Melodify — Spotify Explorer

Aplicación móvil multiplataforma desarrollada con **React Native + Expo** que permite buscar canciones y artistas usando la API de Spotify, reproducir previews de audio mediante Deezer, guardar favoritos, registrar historial de escucha y añadir notas de voz personalizadas por canción.

> Proyecto de Cátedra – Fase 1 y Fase 2 | Diseño y Programación de Software Multiplataforma [DPS441] | Universidad Don Bosco

---

## Descripción

Melodify es una app de música que conecta con Spotify para buscar canciones y artistas. El usuario puede explorar resultados, ver detalles de cada canción, reproducir previews de 30 segundos via Deezer, guardar sus favoritos, llevar un historial de lo escuchado y grabar notas de voz personalizadas. También cuenta con un perfil personalizable con foto tomada desde la cámara del dispositivo.

---

## Tecnologías utilizadas

- **React Native** con **Expo** (~54.0.33)
- **JavaScript (ES6+)**
- **Spotify Web API** — búsqueda y datos de canciones/artistas
- **Deezer API** — previews de audio de 30 segundos
- **React Navigation** — navegación entre pantallas
- **AsyncStorage** — almacenamiento local
- **expo-secure-store** — almacenamiento seguro de tokens
- **expo-camera** — cámara para foto de perfil
- **expo-audio** — grabación y reproducción de notas de voz

---

## Cómo correr el proyecto :)

### Requisitos
- Node.js v18 o superior
- Expo Go instalado en tu dispositivo

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/fr4nc1s0017-debug/Proyecto-de-catedra-Fase-1---DPS.git
cd Proyecto-de-catedra-Fase-1---DPS

# 2. Instalar dependencias
npm install

# 3. Iniciar el proyecto
npx expo start
```

Escanea el código QR con la app **Expo Go** en tu celular.

---

## Pantallas de la aplicación

| Pantalla | Descripción |
|---|---|
| **Splash Screen** | Pantalla de carga inicial con logo de la app |
| **Home** | Búsqueda de canciones y artistas via Spotify API |
| **Details** | Detalle de canción, reproductor de preview, nota de voz y favoritos |
| **Favorites** | Lista de canciones guardadas como favoritas |
| **History** | Historial de las últimas 20 canciones escuchadas |
| **Profile** | Perfil del usuario con foto, nombre, email y canciones recientes |

---

## Funcionalidades :D

### Diseño UI/UX
- Prototipo diseñado en **Figma** con 4 pantallas esenciales: Splash, Home, Details y Perfil
- Tema oscuro inspirado en Spotify con colores `#0a0a0f` y `#1DB954`

### Configuración del proyecto
- Proyecto inicializado con **Expo CLI**
- Estructura organizada en carpetas `src/screens`, `src/navigation` y `src/services`
- Probado en dispositivo físico Android via Expo Go

### Consumo de API REST — Spotify
- Autenticación con **Client Credentials Flow**
- `GET /v1/search` — búsqueda de canciones por nombre o artista
- Visualización de resultados con portada, nombre y artista
- Peticiones HTTP con **axios**

### Navegación
- **StackNavigator** para el flujo principal: `Splash → MainTabs → Details`
- **BottomTabNavigator** con 4 pestañas: Inicio, Favoritos, Historial y Perfil
- Envío de parámetros entre pantallas: `{ item, allSongs, currentIndex }` para navegación prev/next entre canciones

### Almacenamiento de datos
- **AsyncStorage** para:
  - Lista de canciones favoritas
  - Historial de reproducción (últimas 20 canciones con timestamp)
  - Notas de voz asociadas a cada canción (`voice_{id}`)
  - Foto de perfil, nombre y email del usuario
- **expo-secure-store** para el token de Spotify y su fecha de expiración de forma cifrada

### Consumo ampliado de APIs REST
- **Spotify API** — nuevos endpoints:
  - `GET /v1/artists/{id}` — información del artista (géneros, popularidad)
  - `GET /v1/search?type=track` — top tracks del artista actual
- **Deezer API** (segunda API integrada):
  - `GET /search` — preview de audio de 30 segundos por canción

### Sensores y APIs del dispositivo
- **expo-camera** — cámara frontal para capturar foto de perfil
- **expo-audio** — grabación y reproducción de notas de voz por canción
- **Permisos nativos**:
  - `requestPermission()` para cámara
  - `AudioModule.requestRecordingPermissionsAsync()` para micrófono
  - Declarados en `app.json` para Android y iOS

---

## Cómo probar las funcionalidades

| Funcionalidad | Pasos |
|---|---|
| Buscar canciones | Inicio → escribe un artista o canción → toca Buscar |
| Ver detalle y reproducir | Toca cualquier resultado → se carga preview de Deezer |
| Guardar favorito | En detalle → botón "Guardar Favorito" |
| Grabar nota de voz | En detalle → sección "Tu nota de voz" → Grabar → Detener |
| Reproducir nota de voz | En Favoritos → botón ▶ en la canción que tenga nota |
| Ver historial | Pestaña Historial — muestra las últimas 20 canciones |
| Foto de perfil | Pestaña Perfil → toca el avatar → permite acceso a cámara |
| Editar nombre / email | Pestaña Perfil → toca el nombre o el email |
| Ver canciones recientes en perfil | Escucha canciones primero, luego entra a Perfil |

---

## Estructura del proyecto

```
Proyecto-de-catedra-Fase-1---DPS/
├── App.js                        # Navegación raíz (StackNavigator)
├── app.json                      # Configuración de Expo y permisos
├── index.js                      # Punto de entrada
├── package.json                  # Dependencias
├── src/
│   ├── navigation/
│   │   └── MainTabs.js           # BottomTabNavigator (4 pestañas)
│   ├── screens/
│   │   ├── SplashScreen.js       # Pantalla de carga inicial
│   │   ├── HomeScreen.js         # Búsqueda con Spotify API
│   │   ├── DetailsScreen.js      # Detalle, reproductor, nota de voz
│   │   ├── FavoritesScreen.js    # Lista de favoritos guardados
│   │   ├── HistoryScreen.js      # Historial de reproducción
│   │   └── ProfileScreen.js      # Perfil, cámara, canciones recientes
│   └── services/
│       └── spotifyService.js     # Lógica de Spotify API y Deezer API
└── assets/                       # Íconos y splash screen
```

---

## Librerías utilizadas

| Librería | Versión | Uso |
|---|---|---|
| `expo` | ~54.0.33 | Framework base |
| `react-native` | 0.81.5 | UI nativa |
| `@react-navigation/native` | ^6.1.18 | Navegación |
| `@react-navigation/native-stack` | ^6.9.26 | StackNavigator |
| `@react-navigation/bottom-tabs` | ^6.5.20 | BottomTabNavigator |
| `@react-native-async-storage/async-storage` | 2.2.0 | Almacenamiento local |
| `expo-secure-store` | ~15.0.8 | Almacenamiento seguro (token) |
| `expo-camera` | ~16.0.18 | Cámara para foto de perfil |
| `expo-audio` | ~1.1.1 | Grabación y reproducción de audio |
| `expo-av` | ~16.0.8 | Soporte multimedia adicional |
| `axios` | ^1.16.1 | Peticiones HTTP a las APIs |
| `buffer` | ^6.0.3 | Codificación Base64 para auth de Spotify |
| `react-native-gesture-handler` | ~2.28.0 | Gestos táctiles |
| `react-native-reanimated` | ~4.1.1 | Animaciones |
| `react-native-safe-area-context` | ~5.6.0 | Áreas seguras de pantalla |
| `react-native-screens` | ~4.16.0 | Optimización de pantallas |

---

## APIs utilizadas

### Spotify Web API
- Autenticación: Client Credentials Flow
- Documentación: https://developer.spotify.com/documentation/web-api

### Deezer API
- Sin autenticación requerida
- Documentación: https://developers.deezer.com/api

---

## Integrantes del equipo 

| Nombre | Carnet |
|---|---|
| Daniel Adrián Castillo García | CG250400 |
| Daniela Guadalupe Hernández Mejía | HM250077 |
| Francisco Josué Santos Lopez | SL251022 |
| Javier Alexander Ramos Garcia | RG251044 |
| Kevin Alexander Argueta Alas | AA250104 |
| Rodrigo Leandro Hernández Ordóñez | HO250329 |

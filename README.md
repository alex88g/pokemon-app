# ITHS – Laboration 2: React Native (Expo)

**App:** Kanto Pokédex – en React Native-app byggd med Expo som hämtar och visar de 151 första Pokémon.  
Appen uppfyller kraven i uppgiften (se [Kravmatchning](#-kravmatchning)).

---

## 📑 Innehåll

- [ITHS – Laboration 2: React Native (Expo)](#iths--laboration-2-react-native-expo)
  - [📑 Innehåll](#-innehåll)
  - [✨ Funktioner](#-funktioner)
  - [🛠️ Teknisk stack](#️-teknisk-stack)
  - [📋 Kravmatchning](#-kravmatchning)
  - [💻 Förutsättningar](#-förutsättningar)
  - [🚀 Installation \& körning](#-installation--körning)
  - [📂 Projektstruktur](#-projektstruktur)
  - [📜 Scripts \& kommandon](#-scripts--kommandon)
  - [🎨 Appens tema samt kodstil](#-appens-tema-samt-kodstil)
  - [🌐 Byt datakälla](#-byt-datakälla)
  - [📦 Beroenden \& exempel](#-beroenden--exempel)
  - [🖼️ Bygga \& Ikoner/Splash](#️-bygga--ikonersplash)
  - [♿ Tillgänglighet \& Prestanda](#-tillgänglighet--prestanda)
  - [📸 Demo \& Skärmdumpar](#-demo--skärmdumpar)
  - [📦 Inlämning (ZIP utan node_modules)](#-inlämning-zip-utan-node_modules)
  - [Licens](#licens)

Appen har stöd för:

- 🌗 Mörkt/ljust tema
- ⚡ Snabb list-rendering (FlashList)
- 🔔 Push-notiser (dagliga påminnelser)
- 🌀 Globalt laddnings-overlay
- ❤️ Favoriter (lagras i AsyncStorage)

---

## ✨ Funktioner

- **Lista & sök:** Hämtar Pokémon (1–151) och filtrerar via sökfält.
- **Detaljsida:** Bild, typ, vikt, längd + favoritknapp.
- **Favoriter:** Globalt state med Zustand (lagras i AsyncStorage).
- **Inställningar:** Ljust/mörkt tema, modal-exempel.
- **Plattformsspecifikt:** ToastAndroid (Android) & ActionSheetIOS (iOS).
- **Routing:** Stack-navigering med React Navigation.
- **Egen splash screen:** Konfigurerad i `app.json`.
- **Dagliga notiser:** via `expo-notifications`.
- **Globalt overlay:** visuell indikator vid laddning.

---

## 🛠️ Teknisk stack

- **Expo SDK 53**, React Native 0.79.5, TypeScript
- **React Navigation** – stack navigation
- **react-native-paper (MD3)** – UI-komponenter
- **Zustand** – global state + persist
- **Axios** – HTTP med retry/abort
- **FlashList** – effektiv list-rendering
- **expo-notifications** – push-notiser
- **babel-plugin-module-resolver** – alias `@ → ./src`
- **ESLint & Prettier** – kodkvalitet

> Full lista finns i [package.json](#packagejson).

---

## 📋 Kravmatchning

- **Webbanrop via useEffect:** `src/hooks/useFetch.ts` + `HomeScreen.tsx`, `DetailsScreen.tsx`
- **Minst 1 tredjepartsbibliotek:** axios (även zustand, react-native-paper används)
- **Core Components/APIs (10+):** View, Text, Image, ScrollView, FlatList, TextInput, ActivityIndicator, Switch, Modal, Pressable, SafeAreaView, StatusBar + ToastAndroid/ActionSheetIOS
- **Flexbox:** används i layout för listor/komponenter
- **Omfattning:** flera skärmar, sök, favoriter, state, UI-bibliotek
- **Egen splash screen:** `app.json` + `assets/splash.png`
- **Tredjepartsbibliotek (minst 3):** axios, zustand, react-native-paper
- **Routing-bibliotek:** React Navigation
- **Kodkvalitet:** ESLint & Prettier konfigurerat

---

## 💻 Förutsättningar

- Node.js LTS (rekommenderas v22) via nvm
- Expo Go på mobil eller emulator/simulator
- (Windows) PowerShell rekommenderas

Snabbguide Node via nvm (Windows):

```bash
winget install CoreyButler.NVMforWindows
nvm install lts
nvm use lts
node -v
```

---

## 🚀 Installation & körning

Installera beroenden:

```bash
npm install
```

Säkerställ rätt Expo-version:

```bash
npx expo install react-native@0.74.5 react-native-screens@~3.31.1 react-native-reanimated@~3.10.1 react-native-gesture-handler react-native-safe-area-context
```

Starta (rensa cache):

```bash
npx expo start -c
```

- Tryck `s` → skanna QR-kod (Expo Go)
- Tryck `a` → Android emulator
- Tryck `w` → Web

---

## 📂 Projektstruktur

```plaintext
iths-react-native-lab2/
├─ App.tsx                  # NavigationContainer + Stack-navigering
├─ index.js                 # registerRootComponent + gesture-handler
├─ index.web.js             # Web entrypoint
├─ app.json                 # Expo-konfiguration (ikon, splash, mm)
├─ babel.config.js          # Babel presets, module-resolver, reanimated plugin
├─ tsconfig.json            # TypeScript config
├─ webpack.config.js        # Alias/shims för Expo-ikoner (web)
├─ package.json             # Dependencies + scripts
├─ package-lock.json
├─ README.md                # Dokumentation
│
├─ assets/                  # Bilder och ikoner för appen
│  ├─ splash.png
│  ├─ icon.png
│  └─ adaptive-icon.png
│
├─ src/
│  ├─ components/
│  │  ├─ ItemCard.tsx       # Kortkomponent för listade items
│  │  └─ SearchBar.tsx      # Sökfält
│  │
│  ├─ context/
│  │  └─ GlobalSplashContext.tsx # Context för splash-hantering
│  │
│  ├─ hooks/
│  │  ├─ useFetch.ts        # Custom hook (axios + useEffect)
│  │  ├─ useFrameSize.ts    # Window dimensions (shim för react-navigation)
│  │  └─ useGlobalBlocker.ts# Hook för globala blockeringar
│  │
│  ├─ lib/
│  │  └─ notifications.ts   # Notification helpers
│  │
│  ├─ screens/              # Appens views/screens
│  │  ├─ HomeScreen.tsx
│  │  ├─ DetailsScreen.tsx
│  │  ├─ FavoritesScreen.tsx
│  │  └─ SettingsScreen.tsx
│  │
│  ├─ shims/
│  │  └─ material-design-icons.web.js # Shim för Expo-ikoner på webben
│  │
│  ├─ store/
│  │  └─ useFavorites.ts    # Zustand store för favoriter
│  │
│  ├─ theme/
│  │  ├─ theme.ts           # Färgpalett, typografi, mm
│  │  └─ ThemeContext.tsx   # Context för tema
│  │
│  └─ types/                # TS typer (för framtida användning)
│
├─ .eslintrc.js             # ESLint regler
├─ .prettierrc              # Prettier formatteringsregler
└─ .gitignore

```

---

## 📜 Scripts & kommandon

| Ändamål             | Kommando          |
| ------------------- | ----------------- |
| Starta Metro + Expo | `npm run start`   |
| Android emulator    | `npm run android` |
| iOS simulator       | `npm run ios`     |
| Web                 | `npm run web`     |
| Lint                | `npm run lint`    |
| Format              | `npm run format`  |
| Health check        | `npx expo-doctor` |
| Rensa cache         | `expo start -c`   |

---

## 🎨 Appens tema samt kodstil

Definieras i `src/theme/theme.ts` via `ThemeContext`.

- 🌞 Ljust & 🌙 mörkt läge (MD3)
- Gemensam **roundness**: `12`
- **Färgpalett**:
  - Light → primary `#4E937A`, secondary `#B4656F`
  - Dark → primary `#81C7B2`, secondary `#E2959B`

Tema väljs i **Settings** och sparas i `AsyncStorage`.

- **ESLint:** @react-native/eslint-config, eslint-plugin-react, eslint-plugin-react-hooks
- **Prettier:** single quotes, semikolon, trailing commas

Kör:

```bash
npm run lint
npm run format
```

---

## 🌐 Byt datakälla

Uppgiften tillåter **extern JSON** i stället för API.

1. Lägg din JSON på publik URL (t.ex. GitHub raw, Gist, jsonbin.io).
2. Ändra URL i `HomeScreen.tsx`:

```ts
const { data } = useFetch<{ results: PokemonListItem[] }>('https://din-url.exempel/data.json');
```

3. Struktur:

```json
{
  "results": [{ "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" }]
}
```

---

## 📦 Beroenden & exempel

**Navigation**

```ts
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
```

**Zustand**

```ts
import { useFavorites } from '@/store/useFavorites';
```

**Axios**

```ts
import axios from 'axios';
```

**react-native-paper**

```tsx
import { Provider as PaperProvider, Button, Text } from 'react-native-paper';
```

---

## 🖼️ Bygga & Ikoner/Splash

`app.json` innehåller konfiguration för:

- App-ikon (`assets/icon.png`) – 1024×1024, ej transparent
- Adaptiv ikon (`assets/adaptive-icon.png`) – kvadratisk (Android)
- Splash (`assets/splash.png`) – 1242×2436+, `resizeMode: contain`

---

## ♿ Tillgänglighet & Prestanda

**A11y**

- `accessibilityRole` + `accessibilityLabel`
- `accessibilityIgnoresInvertColors` på bilder

**Prestanda**

- FlashList i listor
- Bild-cache i ItemCard
- useMemo/useCallback för optimering
- useFetch med TTL-cache + abort

---

## 📸 Demo & Skärmdumpar

> Lägg skärmdumpar i `./assets/screens/`.

**Hem (ljust)**  
![Home](assets/screens/home-light.png)

**Detaljer (mörkt)**  
![Details](assets/screens/details-dark.png)

**Favoriter**  
![Favorites](assets/screens/favorites.png)

---

## 📦 Inlämning (ZIP utan node_modules)

1. Rensa onödigt:

```bash
npx expo-doctor
npm run lint
npm run format
```

2. Skapa ZIP över källkod **utan**:

- `node_modules/`
- filer i `.gitignore`

## Licens

Alexander Gallorini - ITHS / JSU24
# pokemon-app

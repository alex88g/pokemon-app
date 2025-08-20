module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',

            // ⬇⬇ Alias så webben använder Expo-ikoner
            '@react-native-vector-icons/material-design-icons':
              './src/shims/material-design-icons.web.js',
            '@react-native-vector-icons/material-community-icons':
              '@expo/vector-icons/MaterialCommunityIcons',
            'react-native-vector-icons/MaterialCommunityIcons':
              '@expo/vector-icons/MaterialCommunityIcons',
            'react-native-vector-icons/MaterialIcons': '@expo/vector-icons/MaterialIcons',
          },
          extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
      // Behövs normalt inte med webpack, men om du VILL:
      // 'babel-plugin-transform-import-meta'
    ],
  };
};

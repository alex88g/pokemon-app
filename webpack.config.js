const path = require('path');

module.exports = (env, argv) => {
  const config = require('@expo/webpack-config')(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@react-native-vector-icons/material-design-icons': path.resolve(
      __dirname,
      'src/shims/material-design-icons.web.js',
    ),
    '@react-native-vector-icons/material-community-icons': require.resolve(
      '@expo/vector-icons/MaterialCommunityIcons',
    ),
    'react-native-vector-icons/MaterialCommunityIcons': require.resolve(
      '@expo/vector-icons/MaterialCommunityIcons',
    ),
    'react-native-vector-icons/MaterialIcons': require.resolve('@expo/vector-icons/MaterialIcons'),
  };

  // (valfritt men bra) Tysta just den här varningen
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /@react-native-vector-icons\/material-design-icons/,
  ];

  return config;
};

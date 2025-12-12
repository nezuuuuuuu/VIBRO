module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    'babel-plugin-transform-import-meta',
    "react-native-reanimated/plugin", // MUST be last
  ],
};

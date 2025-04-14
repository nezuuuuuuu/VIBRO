const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    resolver: {
      assetExts: ['bin','tflite', ...getDefaultConfig(__dirname).resolver.assetExts], // Add .bin to the list of recognized extensions
    },
  };
module.exports = mergeConfig(getDefaultConfig(__dirname), config);

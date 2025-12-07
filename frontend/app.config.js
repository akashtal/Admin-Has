export default {
  expo: {
    name: "HashView",
    slug: "hashview",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/HashViewlogo-01.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],

    splash: {
      image: "./assets/HashViewSplash.png",
      resizeMode: "contain",
      backgroundColor: "#210059"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hashview.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "HashView needs your location to show nearby businesses and verify reviews.",
        NSLocationAlwaysUsageDescription:
          "HashView uses your location to provide accurate business information.",
        NSCameraUsageDescription: "HashView needs camera access to scan QR codes and upload photos.",
        NSPhotoLibraryUsageDescription: "HashView needs access to your photo library to upload images.",
        ITSAppUsesNonExemptEncryption: false
      },
      buildNumber: "5"
    },

    android: {
      package: "com.hashview.apps",
      versionCode: 5,
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "AIzaSyCgafT4Tw62CuxxN5DwbkqWIK9pVflKEXI"
        }
      }
    },

    web: {
      bundler: "metro"
    },

    plugins: [
      "expo-dev-client",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow HashView to use your location."
        }
      ],
      "expo-notifications",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow HashView to access your photos."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow HashView to access your camera."
        }
      ],
      "expo-font",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/HashViewSplash.png",
          resizeMode: "contain",
          backgroundColor: "#210059"
        }
      ]
    ],

    extra: {
      eas: {
        projectId: "d4838e65-984b-45e4-b2d8-a03d28a6fb43"
      }
    },
    owner: "hashview"
  }
};

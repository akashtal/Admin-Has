import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FlashMessage from 'react-native-flash-message';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import { initializeSentry } from './src/config/sentry.config';

export default function App() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  useEffect(() => {
    // Initialize Sentry
    initializeSentry();
  }, []);

  // Get status bar height
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 44;
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ExpoStatusBar style="light" />
        {!isSplashComplete && (
          <AnimatedSplashScreen onAnimationComplete={() => setIsSplashComplete(true)} />
        )}
        {isSplashComplete && (
          <>
            <AppNavigator />
            <FlashMessage 
              position="top" 
              floating={true}
              statusBarHeight={statusBarHeight}
            />
          </>
        )}
      </Provider>
    </GestureHandlerRootView>
  );
}


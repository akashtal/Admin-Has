import React, { useEffect } from 'react';
import { View, Image, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../config/colors';

export default function SplashScreen({ navigation }) {
  const scaleAnim = new Animated.Value(0.3);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Only navigate if navigation prop exists (when used inside AuthNavigator)
    // When used in AppNavigator, navigation is handled by isReady state
    if (navigation && navigation.replace) {
      const timer = setTimeout(() => {
        navigation.replace('RoleSelection');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [navigation]);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      className="flex-1 justify-center items-center"
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Logo */}
      <Animated.View 
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
        className="items-center"
      >
        <Image
          source={require('../../../assets/HashViewlogo-01.png')}
          style={{ width: 280, height: 280 }}
          resizeMode="contain"
        />
      </Animated.View>
    </LinearGradient>
  );
}

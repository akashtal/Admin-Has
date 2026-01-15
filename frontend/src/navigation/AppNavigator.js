import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        // Race between loadUser and a timeout
        const loadUserPromise = dispatch(loadUser()).unwrap();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 15000)
        );

        await Promise.race([loadUserPromise, timeoutPromise]);
      } catch (error) {
        console.log('Initialization failed or timed out:', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#210059', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('../../assets/HashViewSplash.png')}
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
        <ActivityIndicator size="large" color="#ffffff" style={{ position: 'absolute', bottom: 100 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}


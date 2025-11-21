import React, { useEffect } from 'react';
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
        await dispatch(loadUser()).unwrap();
      } catch (error) {
        console.log('No user logged in');
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
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}


import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

// User Screens
import UserHomeScreen from '../screens/user/UserHomeScreen';
import SearchScreen from '../screens/user/SearchScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import BusinessDetailScreen from '../screens/user/BusinessDetailScreen';
import AddReviewScreen from '../screens/user/AddReviewScreen';
import CouponsScreen from '../screens/user/CouponsScreen';

// Business Screens
import BusinessDashboardScreen from '../screens/business/BusinessDashboardScreen';
import BusinessRegistrationScreen from '../screens/business/BusinessRegistrationScreen';
import VerifyBusinessScreen from '../screens/business/VerifyBusinessScreen';
import ManageCouponsScreen from '../screens/business/ManageCouponsScreen';
import ViewReviewsScreen from '../screens/business/ViewReviewsScreen';
import AnalyticsDashboardScreen from '../screens/business/AnalyticsDashboardScreen';
import EditBusinessInfoScreen from '../screens/business/EditBusinessInfoScreen';

// Admin Analytics Screen (Read-only)
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// User Stack
function UserStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="UserHome" component={UserHomeScreen} options={{ title: 'HashView' }} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={{ title: 'Business Details' }} />
      <Stack.Screen name="AddReview" component={AddReviewScreen} options={{ title: 'Add Review' }} />
      <Stack.Screen name="Coupons" component={CouponsScreen} options={{ title: 'My Coupons' }} />
    </Stack.Navigator>
  );
}

// Business Stack
function BusinessStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationScreen} />
      <Stack.Screen name="VerifyBusiness" component={VerifyBusinessScreen} />
      <Stack.Screen name="ManageCoupons" component={ManageCouponsScreen} />
      <Stack.Screen name="ViewReviews" component={ViewReviewsScreen} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="EditBusinessInfo" component={EditBusinessInfoScreen} />
    </Stack.Navigator>
  );
}

// No separate admin stack needed - admins just see analytics + profile

export default function MainNavigator() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'admin') {
    // Admin sees only read-only analytics (all management on web dashboard)
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Analytics" 
          component={AdminDashboardScreen}
          options={{ title: 'Platform Analytics' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    );
  }

  if (user?.role === 'business') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Business') iconName = focused ? 'business' : 'business-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Business" component={BusinessStack} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // Customer role (default)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={UserStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


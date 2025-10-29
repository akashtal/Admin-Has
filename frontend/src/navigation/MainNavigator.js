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
import ManageCouponsScreen from '../screens/business/ManageCouponsScreen';
import ViewReviewsScreen from '../screens/business/ViewReviewsScreen';
import AnalyticsDashboardScreen from '../screens/business/AnalyticsDashboardScreen';
import EditBusinessInfoScreen from '../screens/business/EditBusinessInfoScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import BusinessManagementScreen from '../screens/admin/BusinessManagementScreen';
import ReviewManagementScreen from '../screens/admin/ReviewManagementScreen';

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
      <Stack.Screen name="ManageCoupons" component={ManageCouponsScreen} />
      <Stack.Screen name="ViewReviews" component={ViewReviewsScreen} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
      <Stack.Screen name="EditBusinessInfo" component={EditBusinessInfoScreen} />
    </Stack.Navigator>
  );
}

// Admin Stack
function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} />
      <Stack.Screen name="BusinessManagement" component={BusinessManagementScreen} options={{ title: 'Business Management' }} />
      <Stack.Screen name="ReviewManagement" component={ReviewManagementScreen} options={{ title: 'Review Management' }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'admin') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
            else if (route.name === 'Businesses') iconName = focused ? 'business' : 'business-outline';
            else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={AdminStack} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
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


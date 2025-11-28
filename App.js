// Navigointiin: https://reactnavigation.org/docs/native-stack-navigator/ ja https://reactnavigation.org/docs/bottom-tab-navigator/
// https://javascript.plainenglish.io/creating-a-smooth-sign-in-and-logout-experience-with-react-native-62e5deffbff

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import HomeScreen from './components/HomeScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import ResultsScreen from './components/ResultsScreen';
import CalendarScreen from './components/CalendarScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from './styles/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './authentication/AuthContext';
import LoginScreen from './authentication/LoginScreen';
import RegisterScreen from './authentication/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, logout, profile } = useContext(AuthContext);

  console.log('Current user profile:', profile);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // Jos kirjautuneena sisään, näytetään pääsovellus välilehtinavigaatiolla
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: COLORS.headerBackground },
            headerTitleStyle: { color: COLORS.text },
            headerRight: () => (
              <View style={{ alignItems: 'center' }}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.text}
                style={{ marginRight: 15 }}
                onPress={logout}
              />
              <Text style={{ color: COLORS.text, marginRight: 15, fontSize: 11 }}>Logout</Text>
              </View>
            ),
            headerLeft: () => (
              <View style={{ alignItems: 'center' }}>
                <Ionicons
                  name="person-outline"
                  size={24}
                  color={COLORS.text}
                  style={{ marginLeft: 15 }}
                />
                <Text style={{ color: COLORS.text, marginLeft: 15, fontSize: 11 }}>{profile ? profile.firstName : user?.email ?? 'Profile'}</Text>
              </View>
            ),
            tabBarStyle: { backgroundColor: '#222222' },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: '#888888',
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Results') {
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            }
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Results" component={ResultsScreen} />
          <Tab.Screen name="Calendar" component={CalendarScreen} />
        </Tab.Navigator>
      ) : (
        // Jos ei kirjautuneena sisään, näytetään Login / Register -näkymä
        <Stack.Navigator screenOptions={{ 
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: COLORS.headerBackground },
          headerTitleStyle: { color: COLORS.text } 
          }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

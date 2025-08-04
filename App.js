import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ActivityIndicator, View } from 'react-native';

// Import screens
import ScannerScreen from './src/screens/ScannerScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import context and utilities
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { colors } from './src/utils/helpers';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icon component (simple text-based icons for now)
const TabIcon = ({ name, focused, theme }) => (
  <Text style={[styles.tabIcon, { color: focused ? theme.primary : theme.textSecondary }]}>
    {name === 'Scanner' ? '📷' : name === 'History' ? '📋' : '⚙️'}
  </Text>
);

// Scanner Stack Navigator
function ScannerStack() {
  const { theme, isDarkMode } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.text,
        },
        headerShadowVisible: !isDarkMode,
      }}
    >
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Barcode Scanner' }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
}

// History Stack Navigator
function HistoryStack() {
  const { theme, isDarkMode } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.text,
        },
        headerShadowVisible: !isDarkMode,
      }}
    >
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Scan History' }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStack() {
  const { theme, isDarkMode } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.text,
        },
        headerShadowVisible: !isDarkMode,
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}

// App Navigator Component
function AppNavigator() {
  const { theme, isDarkMode } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.surface} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} theme={theme} />
          ),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingVertical: 5,
            paddingBottom: 15,
            height: 90,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 5,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Scanner"
          component={ScannerStack}
          options={{
            title: 'Scanner',
            tabBarLabel: 'Scanner'
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryStack}
          options={{
            title: 'History',
            tabBarLabel: 'History'
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings'
          }}
        />
      </Tab.Navigator>
    </>
  );
}

// Main App Component
export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SettingsProvider>
  );
}

// App Content Component
function AppContent() {
  const { isLoading, theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

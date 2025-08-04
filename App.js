import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text } from 'react-native';

// Import screens
import ScannerScreen from './src/screens/ScannerScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Import utilities
import { colors } from './src/utils/helpers';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icon component (simple text-based icons for now)
const TabIcon = ({ name, focused }) => (
  <Text style={[styles.tabIcon, { color: focused ? colors.primary : colors.textSecondary }]}>
    {name === 'Scanner' ? '📷' : '📋'}
  </Text>
);

// Scanner Stack Navigator
function ScannerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingVertical: 5,
            height: 60,
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
          name="ScannerTab"
          component={ScannerStack}
          options={{
            title: 'Scanner',
            tabBarLabel: 'Scanner'
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStack}
          options={{
            title: 'History',
            tabBarLabel: 'History'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
});

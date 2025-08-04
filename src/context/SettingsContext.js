import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@app_settings';

const defaultSettings = {
  // Scanner Settings
  vibrationOnScan: true,
  soundOnScan: true,
  autoFocus: true,
  flashEnabled: false,
  scanDelay: 1.0, // seconds

  // Data & Privacy
  autoSaveScans: true,
  anonymousUsage: true,

  // Display & Interface
  language: 'en',
  fontSize: 'medium', // small, medium, large, extra-large
  colorBlindSupport: false,
  compactView: false,

  // Notifications & Alerts
  allergenAlerts: true,
  nutritionWarnings: true,
  newProductNotifications: true,
  updateNotifications: true,

  // Product Analysis
  preferredScoring: 'comprehensive', // nutri-score, nova, eco-score, comprehensive
  dietaryPreferences: [], // vegetarian, vegan, kosher, halal
  healthGoals: [], // weight-loss, muscle-gain, heart-health

  // Personal Allergens
  personalAllergens: [], // milk, eggs, fish, shellfish, tree-nuts, peanuts, wheat, soybeans

  // Advanced Settings
  offlineMode: false,
  cloudBackup: false,
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const updateMultipleSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (settingsJson) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      const validSettings = { ...defaultSettings, ...importedSettings };
      setSettings(validSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(validSettings));
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  const value = {
    settings,
    updateSetting,
    updateMultipleSettings,
    resetSettings,
    exportSettings,
    importSettings,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Helper functions for settings
export const getFontSize = (fontSize) => {
  switch (fontSize) {
    case 'small': return { base: 14, title: 18, header: 20 };
    case 'medium': return { base: 16, title: 20, header: 24 };
    case 'large': return { base: 18, title: 22, header: 26 };
    case 'extra-large': return { base: 20, title: 24, header: 28 };
    default: return { base: 16, title: 20, header: 24 };
  }
};

export const getAllergenList = () => [
  { key: 'milk', label: 'Milk' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'shellfish', label: 'Shellfish' },
  { key: 'tree-nuts', label: 'Tree Nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'wheat', label: 'Wheat' },
  { key: 'soybeans', label: 'Soybeans' },
];

export const getDietaryPreferences = () => [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'kosher', label: 'Kosher' },
  { key: 'halal', label: 'Halal' },
];

export const getHealthGoals = () => [
  { key: 'weight-loss', label: 'Weight Loss' },
  { key: 'muscle-gain', label: 'Muscle Gain' },
  { key: 'heart-health', label: 'Heart Health' },
];

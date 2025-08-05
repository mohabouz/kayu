import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getFontSize } from '../context/SettingsContext';

export default function TermsOfServiceScreen() {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const fontSizes = getFontSize(settings.fontSize);
  const styles = getThemedStyles(theme, fontSizes);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.text}>
        By using this app, you agree to use it for informational purposes only. The food product data is provided by the OpenFoodFacts API and may not always be accurate or up to date. This app is not a substitute for professional dietary or medical advice. Use at your own risk.
      </Text>
      <Text style={styles.text}>
        We reserve the right to update these terms at any time. Continued use of the app constitutes acceptance of any changes.
      </Text>
    </ScrollView>
  );
}

const getThemedStyles = (theme, fontSizes) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  text: {
    fontSize: fontSizes.base,
    color: theme.text,
    marginBottom: 16,
    lineHeight: 22,
  },
});

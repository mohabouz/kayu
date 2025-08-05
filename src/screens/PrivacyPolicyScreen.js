import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getFontSize } from '../context/SettingsContext';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const fontSizes = getFontSize(settings.fontSize);
  const styles = getThemedStyles(theme, fontSizes);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.text}>
        We value your privacy. This app does not collect or share any personal information. All scan history and preferences are stored locally on your device. We do not track, sell, or transmit your data to any third parties. For barcode lookups, we use the public OpenFoodFacts API, but no personal data is sent.
      </Text>
      <Text style={styles.text}>
        If you have any questions about privacy, please contact us at support@example.com.
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getAllergenList, getDietaryPreferences, getHealthGoals } from '../context/SettingsContext';
import { StorageService } from '../services/StorageService';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { settings, updateSetting, exportSettings, resetSettings } = useSettings();
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showHealthGoalsModal, setShowHealthGoalsModal] = useState(false);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await StorageService.clearHistory();
            if (success) {
              Alert.alert('Success', 'Scan history has been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear history. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleExportSettings = () => {
    Alert.alert(
      'Export Settings',
      'Export your settings to share or backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            const settingsData = exportSettings();
            Alert.alert('Settings Exported', 'Settings have been exported.');
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset All Settings',
      'This will reset all settings to their default values. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
          }
        }
      ]
    );
  };

  const SettingItem = ({ title, subtitle, onPress, rightComponent, disabled = false }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: theme.surface, borderBottomColor: theme.border },
        disabled && { opacity: 0.5 }
      ]}
      onPress={onPress}
      disabled={!onPress || disabled}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );

  const MultiSelectModal = ({ visible, onClose, title, items, selectedItems, onSelectionChange }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.modalClose, { color: theme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  const newSelection = selectedItems.includes(item.key)
                    ? selectedItems.filter(key => key !== item.key)
                    : [...selectedItems, item.key];
                  onSelectionChange(newSelection);
                }}
              >
                <Text style={[styles.modalItemText, { color: theme.text }]}>{item.label}</Text>
                <View style={[
                  styles.checkbox,
                  { borderColor: theme.border },
                  selectedItems.includes(item.key) && { backgroundColor: theme.primary }
                ]}>
                  {selectedItems.includes(item.key) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      lineHeight: 20,
    },
    settingRight: {
      marginLeft: 16,
    },
    sliderContainer: {
      flex: 1,
      marginHorizontal: 16,
    },
    sliderValue: {
      minWidth: 40,
      textAlign: 'center',
    },
    appInfo: {
      padding: 20,
      alignItems: 'center',
      marginTop: 20,
    },
    appName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    dangerButton: {
      backgroundColor: theme.error,
      marginHorizontal: 20,
      marginTop: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 12,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalClose: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
    },
    modalItemText: {
      fontSize: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <SectionHeader title="Appearance" />
        <SettingItem
          title="Dark Mode"
          subtitle={isDarkMode ? "Dark theme is enabled" : "Light theme is enabled"}
          rightComponent={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Font Size"
          subtitle={`Current: ${settings.fontSize}`}
          onPress={() => {
            const sizes = ['small', 'medium', 'large', 'extra-large'];
            const currentIndex = sizes.indexOf(settings.fontSize);
            const nextIndex = (currentIndex + 1) % sizes.length;
            updateSetting('fontSize', sizes[nextIndex]);
          }}
        />
        <SettingItem
          title="Color Blind Support"
          subtitle="Alternative colors for accessibility"
          rightComponent={
            <Switch
              value={settings.colorBlindSupport}
              onValueChange={(value) => updateSetting('colorBlindSupport', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Compact View"
          subtitle="Show condensed product information"
          rightComponent={
            <Switch
              value={settings.compactView}
              onValueChange={(value) => updateSetting('compactView', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />

        {/* Scanner Section */}
        <SectionHeader title="Scanner" />
        <SettingItem
          title="Vibration on Scan"
          subtitle="Haptic feedback when barcode is detected"
          rightComponent={
            <Switch
              value={settings.vibrationOnScan}
              onValueChange={(value) => updateSetting('vibrationOnScan', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Sound on Scan"
          subtitle="Audio confirmation when scanning"
          rightComponent={
            <Switch
              value={settings.soundOnScan}
              onValueChange={(value) => updateSetting('soundOnScan', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Auto Focus"
          subtitle="Continuous camera auto-focus"
          rightComponent={
            <Switch
              value={settings.autoFocus}
              onValueChange={(value) => updateSetting('autoFocus', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Scan Delay"
          subtitle={`${settings.scanDelay}s between scans`}
          rightComponent={
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderValue, { color: theme.text }]}>
                {settings.scanDelay}s
              </Text>
            </View>
          }
        />

        {/* Notifications & Alerts */}
        <SectionHeader title="Notifications & Alerts" />
        <SettingItem
          title="Allergen Alerts"
          subtitle="Warn about personal allergens"
          rightComponent={
            <Switch
              value={settings.allergenAlerts}
              onValueChange={(value) => updateSetting('allergenAlerts', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Personal Allergens"
          subtitle={`${settings.personalAllergens.length} selected`}
          onPress={() => setShowAllergenModal(true)}
        />
        <SettingItem
          title="Nutrition Warnings"
          subtitle="Alert for high sodium, sugar, etc."
          rightComponent={
            <Switch
              value={settings.nutritionWarnings}
              onValueChange={(value) => updateSetting('nutritionWarnings', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="New Product Notifications"
          subtitle="When scanning unknown products"
          rightComponent={
            <Switch
              value={settings.newProductNotifications}
              onValueChange={(value) => updateSetting('newProductNotifications', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />

        {/* Product Analysis */}
        <SectionHeader title="Product Analysis" />
        <SettingItem
          title="Scoring System"
          subtitle={`Current: ${settings.preferredScoring}`}
          onPress={() => {
            const systems = ['comprehensive', 'nutri-score', 'nova', 'eco-score'];
            const currentIndex = systems.indexOf(settings.preferredScoring);
            const nextIndex = (currentIndex + 1) % systems.length;
            updateSetting('preferredScoring', systems[nextIndex]);
          }}
        />
        <SettingItem
          title="Dietary Preferences"
          subtitle={`${settings.dietaryPreferences.length} selected`}
          onPress={() => setShowDietaryModal(true)}
        />
        <SettingItem
          title="Health Goals"
          subtitle={`${settings.healthGoals.length} selected`}
          onPress={() => setShowHealthGoalsModal(true)}
        />

        {/* Data & Privacy */}
        <SectionHeader title="Data & Privacy" />
        <SettingItem
          title="Auto-save Scans"
          subtitle="Automatically save to history"
          rightComponent={
            <Switch
              value={settings.autoSaveScans}
              onValueChange={(value) => updateSetting('autoSaveScans', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Anonymous Usage"
          subtitle="Help improve the app"
          rightComponent={
            <Switch
              value={settings.anonymousUsage}
              onValueChange={(value) => updateSetting('anonymousUsage', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
            />
          }
        />
        <SettingItem
          title="Export Settings"
          subtitle="Backup your preferences"
          onPress={handleExportSettings}
        />

        {/* Advanced Settings */}
        <SectionHeader title="Advanced" />
        <SettingItem
          title="Offline Mode"
          subtitle="Download database for offline use"
          disabled={true}
          rightComponent={
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
              disabled={true}
            />
          }
        />
        <SettingItem
          title="Cloud Backup"
          subtitle="Sync settings across devices"
          disabled={true}
          rightComponent={
            <Switch
              value={settings.cloudBackup}
              onValueChange={(value) => updateSetting('cloudBackup', value)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={'#FFFFFF'}
              disabled={true}
            />
          }
        />

        {/* About Section */}
        <SectionHeader title="About" />
        <SettingItem
          title="Privacy Policy"
          subtitle="Learn how we protect your data"
        />
        <SettingItem
          title="Terms of Service"
          subtitle="Terms and conditions for using this app"
        />

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Kayu Barcode Scanner</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
          <Text style={styles.dangerButtonText}>Clear All History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: theme.warning }]}
          onPress={handleResetSettings}
        >
          <Text style={styles.dangerButtonText}>Reset All Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Modals */}
      <MultiSelectModal
        visible={showAllergenModal}
        onClose={() => setShowAllergenModal(false)}
        title="Personal Allergens"
        items={getAllergenList()}
        selectedItems={settings.personalAllergens}
        onSelectionChange={(selection) => updateSetting('personalAllergens', selection)}
      />

      <MultiSelectModal
        visible={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
        title="Dietary Preferences"
        items={getDietaryPreferences()}
        selectedItems={settings.dietaryPreferences}
        onSelectionChange={(selection) => updateSetting('dietaryPreferences', selection)}
      />

      <MultiSelectModal
        visible={showHealthGoalsModal}
        onClose={() => setShowHealthGoalsModal(false)}
        title="Health Goals"
        items={getHealthGoals()}
        selectedItems={settings.healthGoals}
        onSelectionChange={(selection) => updateSetting('healthGoals', selection)}
      />
    </View>
  );
}

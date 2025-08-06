import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  AppState,
  Vibration,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import { StorageService } from '../services/StorageService';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);
  const [scanSound, setScanSound] = useState(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualError, setManualError] = useState('');

  // Load scan sound effect
  useEffect(() => {
    let isMounted = true;
    const loadScanSound = async () => {
      if (settings.soundOnScan) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/beep.mp3'),
            { shouldPlay: false }
          );
          if (isMounted) setScanSound(sound);
        } catch (error) {
          console.log('Could not load scan sound:', error);
        }
      } else {
        if (scanSound) {
          await scanSound.unloadAsync();
          if (isMounted) setScanSound(null);
        }
      }
    };

    loadScanSound();

    return () => {
      isMounted = false;
      if (scanSound) {
        scanSound.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.soundOnScan]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, reset camera
        setCameraKey(prev => prev + 1);
        setScanned(false);
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Handle screen focus
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      // Reset camera when screen comes into focus
      setCameraKey(prev => prev + 1);
      setScanned(false);

      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    // Play scan feedback
    if (settings.vibrationOnScan) {
      Vibration.vibrate(100);
    }

    if (settings.soundOnScan && scanSound) {
      try {
        await scanSound.replayAsync();
      } catch (error) {
        console.log('Could not play scan sound:', error);
      }
    }

    try {
      const result = await OpenFoodFactsAPI.getProductByBarcode(data);

      if (result.success) {
        if (settings.autoSaveScans) {
          await StorageService.saveProductToHistory(result.product);
        }
        navigation.navigate('ProductDetails', { product: result.product });
      } else {
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${data}`,
          [
            {
              text: 'Try Again', onPress: () => {
                setTimeout(() => setScanned(false), settings.scanDelay * 1000);
              }
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup product. Please try again.', [
        {
          text: 'OK', onPress: () => {
            setTimeout(() => setScanned(false), settings.scanDelay * 1000);
          }
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) {
      setManualError('Please enter a barcode.');
      return;
    }

    // Validate barcode (basic check for numbers and length)
    const barcodeRegex = /^\d{8,18}$/;
    if (!barcodeRegex.test(manualBarcode.trim())) {
      setManualError('Please enter a valid barcode (8-18 digits).');
      return;
    }

    setManualError('');
    setLoading(true);
    setManualModalVisible(false);
    setScanned(true);

    // Play scan feedback
    if (settings.vibrationOnScan) {
      Vibration.vibrate(100);
    }

    if (settings.soundOnScan && scanSound) {
      try {
        await scanSound.replayAsync();
      } catch (error) {
        console.log('Could not play scan sound:', error);
      }
    }

    try {
      const result = await OpenFoodFactsAPI.getProductByBarcode(manualBarcode.trim());

      if (result.success) {
        if (settings.autoSaveScans) {
          await StorageService.saveProductToHistory(result.product);
        }
        navigation.navigate('ProductDetails', { product: result.product });
      } else {
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${manualBarcode.trim()}`,
          [
            {
              text: 'Try Again', onPress: () => {
                setTimeout(() => setScanned(false), settings.scanDelay * 1000);
              }
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup product. Please try again.', [
        {
          text: 'OK', onPress: () => {
            setTimeout(() => setScanned(false), settings.scanDelay * 1000);
          }
        },
      ]);
    } finally {
      setLoading(false);
      setManualBarcode('');
      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>No access to camera</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScreenFocused && (
        <CameraView
          key={cameraKey}
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
          autoFocus={settings.autoFocus ? 'on' : 'off'}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.topOverlay}
        >
          <Text style={styles.instructionText}>
            Position the barcode within the frame
          </Text>
        </LinearGradient>

        <View style={styles.scanningArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomOverlay}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingOverlayText}>Looking up product...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setScanned(false)}
                disabled={!scanned}
              >
                <Text style={styles.resetButtonText}>
                  {scanned ? 'Tap to scan again' : 'Ready to scan'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetButton, { marginTop: 16, backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setManualModalVisible(true)}
                disabled={loading}
              >
                <Text style={[styles.resetButtonText, { color: '#FFFFFF' }]}>
                  Enter Barcode Manually
                </Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </View>

      {/* Manual Barcode Entry Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Enter Barcode
            </Text>

            <TextInput
              style={[styles.modalInput, {
                borderColor: manualError ? theme.error : theme.border,
                color: theme.text,
                backgroundColor: theme.background
              }]}
              placeholder="e.g. 1234567890123"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={manualBarcode}
              onChangeText={(text) => {
                setManualBarcode(text);
                if (manualError) setManualError('');
              }}
              autoFocus
              maxLength={18}
              returnKeyType="done"
              onSubmitEditing={handleManualLookup}
            />

            {manualError ? (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {manualError}
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setManualModalVisible(false);
                  setManualBarcode('');
                  setManualError('');
                }}
                style={styles.modalButton}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleManualLookup}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={[styles.modalButtonText, { color: theme.primary, fontWeight: 'bold' }]}>
                  Lookup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topOverlay: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7 * 0.6, // Rectangle for barcode
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomOverlay: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalButtonPrimary: {
    marginLeft: 16,
  },
  modalButtonText: {
    fontSize: 16,
  },
});

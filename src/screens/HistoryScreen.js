import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StorageService } from '../services/StorageService';
import { getSafetyColor, getSafetyText, formatDate } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getFontSize } from '../context/SettingsContext';

export default function HistoryScreen({ navigation }) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fontSizes = getFontSize(settings.fontSize);

  const loadHistory = async () => {
    try {
      const historyData = await StorageService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearHistory();
            setHistory([]);
          }
        }
      ]
    );
  };

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeFromHistory(itemId);
            loadHistory();
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: theme.surface }]}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
      onLongPress={() => handleRemoveItem(item.id)}
    >
      <View style={styles.itemHeader}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage, { backgroundColor: theme.border }]}>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>No Image</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.itemBrand, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.brand}
          </Text>
          <Text style={[styles.itemBarcode, { color: theme.textSecondary }]}>
            {item.barcode}
          </Text>
        </View>
        <View style={styles.itemMeta}>
          <View style={[styles.safetyIndicator, { backgroundColor: getSafetyColor(item.safetyLevel) }]}>
            <Text style={styles.safetyText}>{getSafetyText(item.safetyLevel)}</Text>
          </View>
          <Text style={[styles.scanDate, { color: theme.textSecondary }]}>
            {formatDate(item.scannedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Scan History</Text>
      <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
        Start scanning barcodes to see your product history here
      </Text>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {history.length > 0 && (
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Scan History ({history.length})</Text>
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.error }]}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={history.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  historyItem: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemBarcode: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  safetyIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  safetyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanDate: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  scanButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

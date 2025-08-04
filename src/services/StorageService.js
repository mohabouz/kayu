import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@barcode_scan_history';

export class StorageService {
  static async saveProductToHistory(product) {
    try {
      const existingHistory = await this.getHistory();

      // Add timestamp and create history item
      const historyItem = {
        ...product,
        scannedAt: new Date().toISOString(),
        id: `${product.barcode}_${Date.now()}`
      };

      // Remove duplicate if exists (same barcode)
      const filteredHistory = existingHistory.filter(item => item.barcode !== product.barcode);

      // Add new item to the beginning
      const updatedHistory = [historyItem, ...filteredHistory];

      // Keep only the last 50 items
      const limitedHistory = updatedHistory.slice(0, 50);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
      return true;
    } catch (error) {
      console.error('Error saving to history:', error);
      return false;
    }
  }

  static async getHistory() {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  static async clearHistory() {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing history:', error);
      return false;
    }
  }

  static async removeFromHistory(itemId) {
    try {
      const existingHistory = await this.getHistory();
      const updatedHistory = existingHistory.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error('Error removing from history:', error);
      return false;
    }
  }
}

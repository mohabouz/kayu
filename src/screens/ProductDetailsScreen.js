import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import { getSafetyColor, getSafetyText, formatScore, colors } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { useSettings, getFontSize } from '../context/SettingsContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const styles = getThemedStyles(theme);
  const ingredientAnalysis = OpenFoodFactsAPI.analyzeIngredients(product.ingredients);
  const fontSizes = getFontSize(settings.fontSize);

  // Check for allergens
  const checkAllergens = () => {
    if (!settings.allergenAlerts || !settings.personalAllergens.length) return [];

    const foundAllergens = [];
    const productAllergens = product.allergens || [];
    const productIngredients = product.ingredients_text || '';

    settings.personalAllergens.forEach(allergen => {
      const allergenFound = productAllergens.some(pa =>
        pa.toLowerCase().includes(allergen.replace('-', ' '))
      ) || productIngredients.toLowerCase().includes(allergen.replace('-', ' '));

      if (allergenFound) {
        foundAllergens.push(allergen);
      }
    });

    return foundAllergens;
  };

  const detectedAllergens = checkAllergens();

  // Check for nutrition warnings
  const checkNutritionWarnings = () => {
    if (!settings.nutritionWarnings) return [];

    const warnings = [];
    const nutrients = product.nutriments || {};

    // High sodium warning (>1.5g per 100g)
    if (nutrients.sodium_100g && nutrients.sodium_100g > 1.5) {
      warnings.push({
        type: 'High Sodium',
        value: `${nutrients.sodium_100g.toFixed(1)}g per 100g`,
        level: 'warning'
      });
    }

    // High sugar warning (>15g per 100g)
    if (nutrients.sugars_100g && nutrients.sugars_100g > 15) {
      warnings.push({
        type: 'High Sugar',
        value: `${nutrients.sugars_100g.toFixed(1)}g per 100g`,
        level: 'warning'
      });
    }

    // High saturated fat warning (>5g per 100g)
    if (nutrients['saturated-fat_100g'] && nutrients['saturated-fat_100g'] > 5) {
      warnings.push({
        type: 'High Saturated Fat',
        value: `${nutrients['saturated-fat_100g'].toFixed(1)}g per 100g`,
        level: 'warning'
      });
    }

    return warnings;
  };

  const nutritionWarnings = checkNutritionWarnings();

  // Check dietary preferences compatibility
  const checkDietaryCompatibility = () => {
    if (!settings.dietaryPreferences.length) return [];

    const compatibilityIssues = [];
    const productLabels = product.labels_tags || [];
    const productIngredients = product.ingredients_text || '';

    settings.dietaryPreferences.forEach(preference => {
      let isCompatible = true;
      let reason = '';

      switch (preference) {
        case 'vegetarian':
          if (!productLabels.includes('en:vegetarian') &&
            (productIngredients.toLowerCase().includes('meat') ||
              productIngredients.toLowerCase().includes('chicken') ||
              productIngredients.toLowerCase().includes('beef') ||
              productIngredients.toLowerCase().includes('pork'))) {
            isCompatible = false;
            reason = 'Contains meat ingredients';
          }
          break;
        case 'vegan':
          if (!productLabels.includes('en:vegan') &&
            (productIngredients.toLowerCase().includes('milk') ||
              productIngredients.toLowerCase().includes('egg') ||
              productIngredients.toLowerCase().includes('honey') ||
              productIngredients.toLowerCase().includes('cheese'))) {
            isCompatible = false;
            reason = 'Contains animal-derived ingredients';
          }
          break;
        case 'kosher':
          if (!productLabels.includes('en:kosher')) {
            isCompatible = false;
            reason = 'Not certified kosher';
          }
          break;
        case 'halal':
          if (!productLabels.includes('en:halal')) {
            isCompatible = false;
            reason = 'Not certified halal';
          }
          break;
      }

      if (!isCompatible) {
        compatibilityIssues.push({
          preference: preference,
          reason: reason
        });
      }
    });

    return compatibilityIssues;
  };

  const dietaryIssues = checkDietaryCompatibility();

  const SafetyCard = ({ title, level, score, description }) => (
    <View style={[styles.safetyCard, { backgroundColor: theme.surface }]}>
      <View style={styles.safetyHeader}>
        <Text style={[styles.safetyTitle, { fontSize: fontSizes.title, color: theme.text }]}>{title}</Text>
        <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(level) }]}>
          <Text style={[styles.safetyBadgeText, { fontSize: fontSizes.base }]}>{getSafetyText(level)}</Text>
        </View>
      </View>
      {score !== undefined && (
        <Text style={[styles.scoreText, { fontSize: fontSizes.base, color: theme.textSecondary }]}>
          Score: {formatScore(score)}/100
        </Text>
      )}
      {description && !settings.compactView && (
        <Text style={[styles.descriptionText, { fontSize: fontSizes.base, color: theme.textSecondary }]}>
          {description}
        </Text>
      )}
    </View>
  );

  const IngredientItem = ({ ingredient, analysis }) => (
    <View style={[styles.ingredientItem, { backgroundColor: theme.surface }]}>
      <View style={styles.ingredientHeader}>
        <Text style={[styles.ingredientName, { fontSize: fontSizes.base, color: theme.text }]} numberOfLines={settings.compactView ? 1 : 2}>
          {ingredient.text || ingredient.id || 'Unknown ingredient'}
        </Text>
        <View style={[styles.ingredientBadge, { backgroundColor: getSafetyColor(analysis.level) }]}>
          <Text style={[styles.ingredientBadgeText, { fontSize: fontSizes.base - 2 }]}>{getSafetyText(analysis.level)}</Text>
        </View>
      </View>
      {analysis.reason && !settings.compactView && (
        <Text style={[styles.ingredientReason, { fontSize: fontSizes.base - 2, color: theme.textSecondary }]}>{analysis.reason}</Text>
      )}
    </View>
  );

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Product Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => product.image && setImageModalVisible(true)}
            disabled={!product.image}
          >
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </TouchableOpacity>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}
          >
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
          </LinearGradient>
        </View>

        {/* Overall Safety */}
        <View style={styles.content}>
          <SafetyCard
            title="Overall Safety"
            level={product.safetyLevel}
            score={product.safetyScore}
            description="Based on nutrition grade, processing level, and ingredients analysis"
          />

          {/* Allergen Alert */}
          {detectedAllergens.length > 0 && (
            <View style={[styles.section, styles.allergenAlert, { backgroundColor: theme.surface }]}>
              <Text style={[styles.allergenTitle, { fontSize: fontSizes.title, color: theme.error }]}>
                ⚠️ Allergen Alert
              </Text>
              <Text style={[styles.allergenText, { fontSize: fontSizes.base, color: theme.text }]}>
                This product contains allergens you've marked as personal allergens:
              </Text>
              <View style={styles.allergenList}>
                {detectedAllergens.map((allergen, index) => (
                  <View key={index} style={[styles.allergenBadge, { backgroundColor: theme.error }]}>
                    <Text style={[styles.allergenBadgeText, { fontSize: fontSizes.base }]}>
                      {allergen.replace('-', ' ').toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Nutrition Warnings */}
          {nutritionWarnings.length > 0 && (
            <View style={[styles.section, styles.nutritionWarnings, { backgroundColor: theme.surface }]}>
              <Text style={[styles.warningTitle, { fontSize: fontSizes.title, color: theme.text }]}>
                ⚠️ Nutrition Warnings
              </Text>
              {nutritionWarnings.map((warning, index) => (
                <View key={index} style={[styles.warningItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.warningType, { fontSize: fontSizes.base, color: theme.text }]}>
                    {warning.type}
                  </Text>
                  <Text style={[styles.warningValue, { fontSize: fontSizes.base - 2, color: theme.textSecondary }]}>
                    {warning.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Dietary Preferences Compatibility */}
          {dietaryIssues.length > 0 && (
            <View style={[styles.section, styles.dietaryIssues, { backgroundColor: theme.surface }]}>
              <Text style={[styles.dietaryTitle, { fontSize: fontSizes.title, color: theme.warning }]}>
                🥗 Dietary Preferences Alert
              </Text>
              <Text style={[styles.dietaryText, { fontSize: fontSizes.base, color: theme.text }]}>
                This product may not be compatible with your dietary preferences:
              </Text>
              {dietaryIssues.map((issue, index) => (
                <View key={index} style={[styles.dietaryItem, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.dietaryPreference, { fontSize: fontSizes.base, color: theme.text }]}>
                    {issue.preference.charAt(0).toUpperCase() + issue.preference.slice(1)}
                  </Text>
                  <Text style={[styles.dietaryReason, { fontSize: fontSizes.base - 2, color: theme.textSecondary }]}>
                    {issue.reason}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Nutrition Information */}
          {product.nutritionGrade && product.nutritionGrade !== 'unknown' && (
            <View style={[styles.section]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition Grade</Text>
              <View style={[styles.nutritionGrade, { backgroundColor: theme.surface }]}>
                <Text style={[styles.gradeText, {
                  color: getSafetyColor(
                    product.nutritionGrade === 'a' ? 'good' :
                      product.nutritionGrade === 'b' ? 'good' :
                        product.nutritionGrade === 'c' ? 'ok' :
                          product.nutritionGrade === 'd' ? 'bad' : 'dangerous'
                  )
                }]}>
                  {product.nutritionGrade.toUpperCase()}
                </Text>
                <Text style={[styles.gradeDescription, , { color: theme.textSecondary }]}>
                  Nutri-Score from A (best) to E (worst)
                </Text>
              </View>
            </View>
          )}

          {/* Processing Level */}
          {product.novaGroup > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Processing Level</Text>
              <View style={[styles.novaGroup, { backgroundColor: theme.surface }]}>
                <Text style={[styles.novaNumber, { color: theme.text }]}>NOVA {product.novaGroup}</Text>
                <Text style={[styles.novaDescription, { color: theme.textSecondary }]}>
                  {product.novaGroup === 1 ? 'Unprocessed or minimally processed foods' :
                    product.novaGroup === 2 ? 'Processed culinary ingredients' :
                      product.novaGroup === 3 ? 'Processed foods' :
                        'Ultra-processed food and drink products'}
                </Text>
              </View>
            </View>
          )}

          {/* Ingredients Analysis */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredients Analysis</Text>
            {ingredientAnalysis.length > 0 ? (
              ingredientAnalysis.map((analysis, index) => (
                <IngredientItem
                  key={index}
                  ingredient={product.ingredients[index] || { text: analysis.name }}
                  analysis={analysis}
                />
              ))
            ) : (
              <Text style={styles.noDataText}>No ingredient information available</Text>
            )}
          </View>

          {/* Allergens */}
          {product.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergens</Text>
              <View style={styles.allergenContainer}>
                {product.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenTag}>
                    <Text style={styles.allergenText}>
                      {allergen.replace('en:', '').replace(/-/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Categories */}
          {product.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoryContainer}>
                {product.categories.slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>
                      {category.replace('en:', '').replace(/-/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Action */}
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Text style={styles.scanAgainText}>Scan Another Product</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar hidden />
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              {product.image && (
                <Image
                  source={{ uri: product.image }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const getThemedStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    height: 250,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  barcode: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
  },
  safetyCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
  },
  safetyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  safetyBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scoreText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  nutritionGrade: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gradeDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  novaGroup: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
  },
  novaNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  novaDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  ingredientItem: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  ingredientName: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  ingredientBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  ingredientBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  ingredientReason: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    backgroundColor: theme.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  allergenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noDataText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  scanAgainButton: {
    backgroundColor: theme.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  allergenAlert: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 12,
  },
  allergenTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  allergenText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  allergenBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nutritionWarnings: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderRadius: 12,
  },
  warningTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  warningItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  warningType: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningValue: {
    fontStyle: 'italic',
  },
  dietaryIssues: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 12,
  },
  dietaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dietaryText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  dietaryItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.2)',
  },
  dietaryPreference: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dietaryReason: {
    fontStyle: 'italic',
  },
});

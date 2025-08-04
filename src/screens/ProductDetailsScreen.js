import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OpenFoodFactsAPI } from '../services/OpenFoodFactsAPI';
import { getSafetyColor, getSafetyText, formatScore, colors } from '../utils/helpers';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;

  const ingredientAnalysis = OpenFoodFactsAPI.analyzeIngredients(product.ingredients);

  const SafetyCard = ({ title, level, score, description }) => (
    <View style={styles.safetyCard}>
      <View style={styles.safetyHeader}>
        <Text style={styles.safetyTitle}>{title}</Text>
        <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(level) }]}>
          <Text style={styles.safetyBadgeText}>{getSafetyText(level)}</Text>
        </View>
      </View>
      {score !== undefined && (
        <Text style={styles.scoreText}>Score: {formatScore(score)}/100</Text>
      )}
      {description && (
        <Text style={styles.descriptionText}>{description}</Text>
      )}
    </View>
  );

  const IngredientItem = ({ ingredient, analysis }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientHeader}>
        <Text style={styles.ingredientName} numberOfLines={2}>
          {ingredient.text || ingredient.id || 'Unknown ingredient'}
        </Text>
        <View style={[styles.ingredientBadge, { backgroundColor: getSafetyColor(analysis.level) }]}>
          <Text style={styles.ingredientBadgeText}>{getSafetyText(analysis.level)}</Text>
        </View>
      </View>
      {analysis.reason && (
        <Text style={styles.ingredientReason}>{analysis.reason}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Product Header */}
      <View style={styles.header}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
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

        {/* Nutrition Information */}
        {product.nutritionGrade && product.nutritionGrade !== 'unknown' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Grade</Text>
            <View style={styles.nutritionGrade}>
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
              <Text style={styles.gradeDescription}>
                Nutri-Score from A (best) to E (worst)
              </Text>
            </View>
          </View>
        )}

        {/* Processing Level */}
        {product.novaGroup > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processing Level</Text>
            <View style={styles.novaGroup}>
              <Text style={styles.novaNumber}>NOVA {product.novaGroup}</Text>
              <Text style={styles.novaDescription}>
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
          <Text style={styles.sectionTitle}>Ingredients Analysis</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
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
    color: colors.text,
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
    color: colors.textSecondary,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  nutritionGrade: {
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
  novaGroup: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  novaNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  novaDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ingredientItem: {
    backgroundColor: colors.surface,
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
    color: colors.text,
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
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    backgroundColor: colors.error,
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
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
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
});

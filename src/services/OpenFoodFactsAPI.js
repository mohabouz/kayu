const OPENFOODFACTS_API_BASE = 'https://world.openfoodfacts.org/api/v0';

export class OpenFoodFactsAPI {
  static async getProductByBarcode(barcode) {
    try {
      const response = await fetch(`${OPENFOODFACTS_API_BASE}/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        return {
          success: true,
          product: this.parseProduct(data.product)
        };
      } else {
        return {
          success: false,
          error: 'Product not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + error.message
      };
    }
  }

  static parseProduct(product) {
    return {
      barcode: product.code,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      image: product.image_url,
      ingredients: product.ingredients || [],
      nutriments: product.nutriments || {},
      nutritionGrade: product.nutrition_grades || 'unknown',
      novaGroup: product.nova_group || 0,
      ecoscore: product.ecoscore_grade || 'unknown',
      allergens: product.allergens_tags || [],
      categories: product.categories_tags || [],
      ingredients_text: product.ingredients_text || '',
      // Safety analysis based on various factors
      safetyScore: this.calculateSafetyScore(product),
      safetyLevel: this.getSafetyLevel(product)
    };
  }

  static calculateSafetyScore(product) {
    let score = 70; // Base score

    // Nutrition grade impact
    const nutritionGrade = product.nutrition_grades;
    if (nutritionGrade === 'a') score += 20;
    else if (nutritionGrade === 'b') score += 10;
    else if (nutritionGrade === 'c') score += 0;
    else if (nutritionGrade === 'd') score -= 10;
    else if (nutritionGrade === 'e') score -= 20;

    // Nova group impact (processing level)
    const novaGroup = product.nova_group;
    if (novaGroup === 1) score += 15; // Unprocessed
    else if (novaGroup === 2) score += 5; // Processed culinary ingredients
    else if (novaGroup === 3) score -= 5; // Processed foods
    else if (novaGroup === 4) score -= 15; // Ultra-processed

    // Ecoscore impact
    const ecoscore = product.ecoscore_grade;
    if (ecoscore === 'a') score += 10;
    else if (ecoscore === 'b') score += 5;
    else if (ecoscore === 'c') score += 0;
    else if (ecoscore === 'd') score -= 5;
    else if (ecoscore === 'e') score -= 10;

    // Allergens impact
    const allergens = product.allergens_tags || [];
    score -= allergens.length * 2;

    // Additives impact
    const additives = product.additives_tags || [];
    score -= additives.length * 3;

    return Math.max(0, Math.min(100, score));
  }

  static getSafetyLevel(product) {
    const score = this.calculateSafetyScore(product);

    if (score >= 80) return 'good';
    else if (score >= 60) return 'ok';
    else if (score >= 40) return 'bad';
    else return 'dangerous';
  }

  static analyzeIngredients(ingredients) {
    const analysisResults = [];

    // Common problematic ingredients
    const problematicIngredients = {
      'palm oil': { level: 'bad', reason: 'Environmental concerns and high saturated fat' },
      'high fructose corn syrup': { level: 'dangerous', reason: 'Linked to obesity and diabetes' },
      'monosodium glutamate': { level: 'bad', reason: 'May cause headaches in sensitive individuals' },
      'sodium nitrite': { level: 'dangerous', reason: 'Potential carcinogen when heated' },
      'aspartame': { level: 'bad', reason: 'Artificial sweetener with health concerns' },
      'trans fat': { level: 'dangerous', reason: 'Increases heart disease risk' },
      'hydrogenated oil': { level: 'dangerous', reason: 'Contains trans fats' },
      'artificial colors': { level: 'bad', reason: 'May cause hyperactivity in children' },
      'bha': { level: 'dangerous', reason: 'Potential carcinogen' },
      'bht': { level: 'dangerous', reason: 'Potential carcinogen' }
    };

    // Good ingredients
    const goodIngredients = {
      'organic': { level: 'good', reason: 'No pesticides or synthetic chemicals' },
      'whole grain': { level: 'good', reason: 'High in fiber and nutrients' },
      'vitamin': { level: 'good', reason: 'Essential nutrients' },
      'natural': { level: 'ok', reason: 'Not artificially synthesized' },
      'omega-3': { level: 'good', reason: 'Beneficial fatty acids' },
      'fiber': { level: 'good', reason: 'Supports digestive health' },
      'probiotic': { level: 'good', reason: 'Beneficial bacteria' }
    };

    ingredients.forEach(ingredient => {
      const ingredientName = ingredient.text ? ingredient.text.toLowerCase() : '';
      let analysis = { name: ingredientName, level: 'ok', reason: 'Common food ingredient' };

      // Check for problematic ingredients
      Object.keys(problematicIngredients).forEach(key => {
        if (ingredientName.includes(key)) {
          analysis = {
            name: ingredientName,
            level: problematicIngredients[key].level,
            reason: problematicIngredients[key].reason
          };
        }
      });

      // Check for good ingredients
      Object.keys(goodIngredients).forEach(key => {
        if (ingredientName.includes(key) && analysis.level === 'ok') {
          analysis = {
            name: ingredientName,
            level: goodIngredients[key].level,
            reason: goodIngredients[key].reason
          };
        }
      });

      analysisResults.push(analysis);
    });

    return analysisResults;
  }
}

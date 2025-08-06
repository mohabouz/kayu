# Food Scanner App

<div align="center">
  <img src="assets/icon.png" alt="Kayu Food Scanner Logo" width="120" height="120" style="border-radius: 20px;">
</div>

A React Native Expo app that scans barcodes and analyzes food products using the OpenFoodFacts API.

## Features

- 📱 **Barcode Scanning**: Use your device's camera to scan product barcodes
- 🔍 **Product Lookup**: Automatically fetch product information from OpenFoodFacts
- 📊 **Safety Analysis**: Get comprehensive safety ratings for products and ingredients
- 📋 **Ingredient Analysis**: Detailed breakdown of ingredients with safety levels
- 📜 **Scan History**: Keep track of all scanned products
- 🎨 **Modern UI**: Clean, intuitive interface with safety color coding

## Technology Stack

- **Expo SDK 53**: Cross-platform development framework
- **React Navigation**: Navigation between screens
- **OpenFoodFacts API**: Product data and nutritional information
- **AsyncStorage**: Local data persistence for scan history
- **expo-barcode-scanner**: Camera-based barcode scanning

## Safety Rating System

The app evaluates products based on multiple factors:

- **Nutrition Grade**: Nutri-Score from A (best) to E (worst)
- **Processing Level**: NOVA classification (1-4, lower is better)
- **Eco-Score**: Environmental impact rating
- **Ingredients Analysis**: Individual ingredient safety assessment
- **Additives**: Impact of food additives on health

### Safety Levels

- 🟢 **Good**: High-quality, minimally processed products
- 🟡 **OK**: Acceptable products with minor concerns
- 🔴 **Bad**: Products with health or environmental concerns
- 🟣 **Dangerous**: Products with significant health risks

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Use the Expo Go app on your phone to scan the QR code, or run on an emulator

## Usage

1. **Scanning**: Open the app and point your camera at a barcode
2. **Product Details**: View comprehensive product information and safety analysis
3. **History**: Access your scan history from the History tab
4. **Analysis**: Review ingredient-by-ingredient safety assessments

## Permissions

The app requires camera permission to scan barcodes. This permission is used solely for barcode scanning functionality.

## API

This app uses the [OpenFoodFacts API](https://openfoodfacts.github.io/openfoodfacts-server/api/) to fetch product information. OpenFoodFacts is a collaborative, free and open database of food products from around the world.

## Development

To run the app in development mode:

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

## License

This project is open source and available under the MIT License.

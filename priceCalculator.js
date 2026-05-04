// Price per kg in INR for each scrap type
const PRICE_RATES = {
  Paper: 8,
  Plastic: 12,
  Metal: 25,
  Electronics: 50,
  Appliances: 15,
  Glass: 5,
  Mixed: 10,
};

// Collector gets 70%, platform keeps 30%
const COLLECTOR_SHARE = 0.7;
const PLATFORM_FEE = 0.3;

/**
 * Calculate estimated price for a pickup request.
 */
const calculateEstimatedPrice = (scrapType, estimatedWeight) => {
  const rate = PRICE_RATES[scrapType] || PRICE_RATES['Mixed'];
  return Math.round(rate * estimatedWeight);
};

/**
 * Calculate final price based on actual weight.
 */
const calculateFinalPrice = (scrapType, actualWeight) => {
  const rate = PRICE_RATES[scrapType] || PRICE_RATES['Mixed'];
  const total = Math.round(rate * actualWeight);
  return {
    pricePerKg: rate,
    totalAmount: total,
    collectorShare: Math.round(total * COLLECTOR_SHARE),
    platformFee: Math.round(total * PLATFORM_FEE),
  };
};

/**
 * Get price rate for a scrap type.
 */
const getPriceRate = (scrapType) => {
  return PRICE_RATES[scrapType] || PRICE_RATES['Mixed'];
};

/**
 * AI-based scrap type suggestion (simple rule-based logic).
 * In production, integrate with a real image classification model.
 */
const suggestScrapType = (description = '') => {
  const desc = description.toLowerCase();
  if (desc.includes('paper') || desc.includes('newspaper') || desc.includes('cardboard')) {
    return { suggestedType: 'Paper', confidence: 0.85 };
  }
  if (desc.includes('plastic') || desc.includes('bottle') || desc.includes('container')) {
    return { suggestedType: 'Plastic', confidence: 0.82 };
  }
  if (desc.includes('metal') || desc.includes('iron') || desc.includes('steel') || desc.includes('copper')) {
    return { suggestedType: 'Metal', confidence: 0.88 };
  }
  if (desc.includes('electronic') || desc.includes('mobile') || desc.includes('laptop') || desc.includes('computer')) {
    return { suggestedType: 'Electronics', confidence: 0.90 };
  }
  if (desc.includes('appliance') || desc.includes('fridge') || desc.includes('washing') || desc.includes('ac') || desc.includes('fan')) {
    return { suggestedType: 'Appliances', confidence: 0.87 };
  }
  if (desc.includes('glass') || desc.includes('window') || desc.includes('mirror')) {
    return { suggestedType: 'Glass', confidence: 0.80 };
  }
  return { suggestedType: 'Mixed', confidence: 0.60 };
};

module.exports = { calculateEstimatedPrice, calculateFinalPrice, getPriceRate, suggestScrapType, PRICE_RATES };

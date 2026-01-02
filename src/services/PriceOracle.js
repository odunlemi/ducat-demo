// Manages asset prices and conversions
// In production: integrates with Polygon, Alpha Vantage, FMDQ

export class PriceOracle {
  constructor() {
    this.prices = new Map();
    this.initializePrices();
  }

  initializePrices() {
    // Exchange rate
    this.update("NGN", 1650, "NGN");
    this.update("USD", 1, "USD");

    // US Stocks
    this.update("AAPL", 185, "USD");
    this.update("MSFT", 380, "USD");
    this.update("GOOGL", 140, "USD");
    this.update("TSLA", 245, "USD");
    this.update("AMZN", 175, "USD");

    // ETFs
    this.update("SPY", 450, "USD");
    this.update("VOO", 420, "USD");
    this.update("QQQ", 385, "USD");
    this.update("VTI", 235, "USD");
  }

  update(asset, price, currency) {
    this.prices.set(asset, {
      price,
      currency,
      lastUpdate: Date.now(),
    });
  }

  // Get price in USD
  getInUSD(asset) {
    const priceData = this.prices.get(asset);
    if (!priceData) return 0;

    if (asset === "NGN") {
      return 1 / priceData.price;
    }

    return priceData.price;
  }

  get(asset) {
    return this.prices.get(asset);
  }

  convert(fromAsset, toAsset, amount) {
    const fromUSD = this.getInUSD(fromAsset);
    const toUSD = this.getInUSD(toAsset);

    const amountInUSD = amount * fromUSD;
    return amountInUSD / toUSD;
  }

  // In production, this would fetch from external APIs
  async fetchFromAPI(asset) {
    // Example integration with Polygon.io:
    // const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${asset}/prev?apiKey=${API_KEY}`);
    // const data = await response.json();
    // this.update(asset, data.results[0].c, 'USD');

    // Example integration with FMDQ for NGN rates:
    // const response = await fetch('https://fmdqgroup.com/exchange-rate/');
    // Parse HTML or use their API if available

    throw new Error("API integration not implemented in demo");
  }
}

// Manages all tradeable assets and their properties

import { Asset } from "../models/Asset.js";

export class AssetRegistry {
  constructor() {
    this.assets = new Map();

    // Risk parameters by asset type
    this.riskParams = {
      US_STOCK: {
        collateralRatio: 1.5,
        liquidationThreshold: 1.25,
        haircut: 0.15,
      },
      US_ETF: {
        collateralRatio: 1.4,
        liquidationThreshold: 1.2,
        haircut: 0.1,
      },
      TREASURY: {
        collateralRatio: 1.2,
        liquidationThreshold: 1.1,
        haircut: 0.05,
      },
      NGN_CASH: {
        collateralRatio: 1.1,
        liquidationThreshold: 1.05,
        haircut: 0.02,
      },
    };

    this.initializeAssets();
  }

  initializeAssets() {
    // Currencies
    this.register("NGN", "CURRENCY", "Nigerian Naira", true, true);
    this.register("USD", "CURRENCY", "US Dollar", true, true);

    // US Stocks
    this.register("AAPL", "US_STOCK", "Apple Inc.", false, true);
    this.register("MSFT", "US_STOCK", "Microsoft Corp.", false, true);
    this.register("GOOGL", "US_STOCK", "Alphabet Inc.", false, true);
    this.register("TSLA", "US_STOCK", "Tesla Inc.", false, true);
    this.register("AMZN", "US_STOCK", "Amazon.com Inc.", false, true);

    // ETFs
    this.register("SPY", "US_ETF", "S&P 500 ETF", false, true);
    this.register("VOO", "US_ETF", "Vanguard S&P 500", false, true);
    this.register("QQQ", "US_ETF", "Nasdaq 100 ETF", false, true);
    this.register("VTI", "US_ETF", "Total Market ETF", false, true);
  }

  register(symbol, type, name, canBorrow, canCollateralize) {
    const asset = new Asset(symbol, type, name, canBorrow, canCollateralize);
    this.assets.set(symbol, asset);
  }

  get(symbol) {
    return this.assets.get(symbol);
  }

  getRiskParams(assetType) {
    return this.riskParams[assetType];
  }

  canBorrow(symbol) {
    const asset = this.assets.get(symbol);
    return asset ? asset.canBorrow : false;
  }

  canCollateralize(symbol) {
    const asset = this.assets.get(symbol);
    return asset ? asset.canCollateralize : false;
  }
}

// Orchestrates all components

import { AssetRegistry } from "../services/AssetRegistry.js";
import { PriceOracle } from "../services/PriceOracle.js";
import { RiskEngine } from "./RiskEngine.js";
import { LiquidityPool } from "../models/LiquidityPool.js";
import { UserPosition } from "../models/UserPosition.js";

export class LendingProtocol {
  constructor() {
    // Initialize all components
    this.assetRegistry = new AssetRegistry();
    this.priceOracle = new PriceOracle();
    this.riskEngine = new RiskEngine(this.assetRegistry, this.priceOracle);

    // Storage
    this.pools = new Map();
    this.positions = new Map();

    this.initializePools();
  }

  initializePools() {
    this.pools.set("NGN", new LiquidityPool("NGN", 0.18));
    this.pools.set("USD", new LiquidityPool("USD", 0.05));
  }

  // ============================================
  // PUBLIC API - LIQUIDITY PROVIDERS
  // ============================================

  depositToPool(lpId, asset, amount) {
    if (!this.assetRegistry.canBorrow(asset)) {
      return { success: false, message: `${asset} cannot be lent` };
    }

    const pool = this.pools.get(asset);
    pool.deposit(amount);

    return {
      success: true,
      message: `Deposited ${amount.toLocaleString()} ${asset}`,
      poolStats: pool.getStats(),
    };
  }

  // ============================================
  // PUBLIC API - BORROWERS
  // ============================================

  depositCollateral(userId, asset, quantity) {
    if (!this.assetRegistry.canCollateralize(asset)) {
      return {
        success: false,
        message: `${asset} cannot be used as collateral`,
      };
    }

    if (!this.positions.has(userId)) {
      this.positions.set(userId, new UserPosition(userId));
    }

    const position = this.positions.get(userId);
    position.addCollateral(asset, quantity);

    const borrowingPower = this.riskEngine.calculateBorrowingPower(position);

    return {
      success: true,
      message: `Deposited ${quantity} ${asset} as collateral`,
      borrowingPower,
    };
  }

  borrow(userId, asset, amount) {
    const position = this.positions.get(userId);

    if (!position || position.collateral.length === 0) {
      return { success: false, message: "No collateral deposited" };
    }

    position.accrueInterest(this.pools);

    const borrowingPower = this.riskEngine.calculateBorrowingPower(position);
    const currentLoanValue = this.riskEngine.calculateLoanValue(position);
    const borrowValueUSD = this.priceOracle.getInUSD(asset) * amount;
    const newTotalLoanValue = currentLoanValue + borrowValueUSD;

    if (newTotalLoanValue > borrowingPower.totalCollateralUSD / 1.3) {
      return {
        success: false,
        message: "Insufficient collateral for this borrow amount",
      };
    }

    const pool = this.pools.get(asset);
    const borrowResult = pool.borrow(amount);

    if (!borrowResult.success) {
      return borrowResult;
    }

    position.addLoan(asset, amount);

    return {
      success: true,
      message: `Borrowed ${amount.toLocaleString()} ${asset}`,
      healthFactor: this.riskEngine.calculateHealthFactor(position).toFixed(3),
      interestRate: (pool.interestRate * 100).toFixed(2) + "%",
    };
  }

  repay(userId, asset, amount) {
    const position = this.positions.get(userId);

    if (!position) {
      return { success: false, message: "No position found" };
    }

    position.accrueInterest(this.pools);

    const totalDebt = position.getTotalDebt(asset);

    if (amount > totalDebt) {
      return {
        success: false,
        message: `Repay amount exceeds debt. Total owed: ${totalDebt.toFixed(
          2
        )}`,
      };
    }

    const pool = this.pools.get(asset);
    pool.repay(amount);
    position.reduceLoan(asset, amount);

    return {
      success: true,
      message: `Repaid ${amount.toLocaleString()} ${asset}`,
      remainingDebt: position.getTotalDebt(asset).toFixed(2),
    };
  }

  liquidate(userId, liquidatorId, repayAsset, repayAmount) {
    const position = this.positions.get(userId);

    if (!this.riskEngine.canLiquidate(position)) {
      return { success: false, message: "Position is healthy" };
    }

    position.accrueInterest(this.pools);

    const repayValueUSD = this.priceOracle.getInUSD(repayAsset) * repayAmount;
    const seizeValueUSD =
      this.riskEngine.calculateLiquidationAmount(repayValueUSD);

    const seized = [];
    let remainingToSeize = seizeValueUSD;

    for (const col of position.collateral) {
      if (remainingToSeize <= 0) break;

      const priceUSD = this.priceOracle.getInUSD(col.asset);
      const colValueUSD = col.quantity * priceUSD;

      if (colValueUSD <= remainingToSeize) {
        seized.push({ asset: col.asset, quantity: col.quantity });
        remainingToSeize -= colValueUSD;
        position.removeCollateral(col.asset, col.quantity);
      } else {
        const quantityToSeize = remainingToSeize / priceUSD;
        seized.push({ asset: col.asset, quantity: quantityToSeize });
        position.removeCollateral(col.asset, quantityToSeize);
        remainingToSeize = 0;
      }
    }

    const pool = this.pools.get(repayAsset);
    pool.repay(repayAmount);
    position.reduceLoan(repayAsset, repayAmount);

    return {
      success: true,
      message: `Liquidated ${repayAmount.toLocaleString()} ${repayAsset}`,
      seized,
      bonus: (seizeValueUSD - repayValueUSD).toFixed(2) + " USD",
    };
  }

  updatePrice(asset, newPrice, currency) {
    this.priceOracle.update(asset, newPrice, currency);

    const opportunities = [];

    for (const [userId, position] of this.positions.entries()) {
      if (position.hasLoans() && this.riskEngine.canLiquidate(position)) {
        opportunities.push({
          userId,
          healthFactor: this.riskEngine
            .calculateHealthFactor(position)
            .toFixed(3),
        });
      }
    }

    return {
      success: true,
      message: `Updated ${asset} to ${newPrice} ${currency}`,
      liquidationOpportunities: opportunities,
    };
  }

  getPosition(userId) {
    const position = this.positions.get(userId);
    if (!position) return null;

    position.accrueInterest(this.pools);

    return {
      collateral: position.collateral,
      loans: position.loans,
      healthFactor: this.riskEngine.calculateHealthFactor(position).toFixed(3),
      borrowingPower: this.riskEngine.calculateBorrowingPower(position),
    };
  }

  getPool(asset) {
    const pool = this.pools.get(asset);
    return pool ? pool.getStats() : null;
  }
}

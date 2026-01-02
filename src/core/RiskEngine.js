// Calculates risk metrics and liquidation logic

export class RiskEngine {
  constructor(assetRegistry, priceOracle) {
    this.assetRegistry = assetRegistry;
    this.priceOracle = priceOracle;
    this.LIQUIDATION_BONUS = 0.05;
  }

  calculateCollateralValue(position) {
    let totalValueUSD = 0;

    for (const col of position.collateral) {
      const asset = this.assetRegistry.get(col.asset);
      const priceUSD = this.priceOracle.getInUSD(col.asset);
      const riskParams = this.assetRegistry.getRiskParams(asset.type);

      const effectiveValue = col.quantity * priceUSD * (1 - riskParams.haircut);
      totalValueUSD += effectiveValue;
    }

    return totalValueUSD;
  }

  calculateLoanValue(position) {
    let totalValueUSD = 0;

    for (const loan of position.loans) {
      const totalDebt = loan.principal + loan.accruedInterest;
      const priceUSD = this.priceOracle.getInUSD(loan.asset);

      if (loan.asset === "NGN") {
        totalValueUSD += totalDebt / this.priceOracle.get("NGN").price;
      } else {
        totalValueUSD += totalDebt;
      }
    }

    return totalValueUSD;
  }

  calculateBorrowingPower(position) {
    const collateralValueUSD = this.calculateCollateralValue(position);
    const ngnRate = this.priceOracle.get("NGN").price;

    const maxBorrowUSD = collateralValueUSD / 1.3;

    return {
      totalCollateralUSD: collateralValueUSD,
      maxBorrowUSD,
      maxBorrowNGN: maxBorrowUSD * ngnRate,
    };
  }

  calculateHealthFactor(position) {
    if (!position.hasLoans()) return Infinity;

    const collateralValue = this.calculateCollateralValue(position);
    const loanValue = this.calculateLoanValue(position);

    if (loanValue === 0) return Infinity;

    return collateralValue / loanValue;
  }

  canLiquidate(position) {
    const healthFactor = this.calculateHealthFactor(position);
    return healthFactor < 1.15;
  }

  calculateLiquidationAmount(repayValueUSD) {
    return repayValueUSD * (1 + this.LIQUIDATION_BONUS);
  }
}

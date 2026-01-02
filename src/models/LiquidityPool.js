// Manages lending pool for each asset

export class LiquidityPool {
  constructor(asset, baseInterestRate) {
    this.asset = asset;
    this.totalDeposited = 0;
    this.totalBorrowed = 0;
    this.interestRate = baseInterestRate;
    this.accruedInterest = 0;

    // Interest rate curve parameters
    this.OPTIMAL_UTILIZATION = 0.75;
    this.BASE_RATE = baseInterestRate;
    this.SLOPE_1 = 0.1;
    this.SLOPE_2 = 1.0;
  }

  deposit(amount) {
    this.totalDeposited += amount;
    this.updateInterestRate();
  }

  borrow(amount) {
    if (this.getAvailableLiquidity() < amount) {
      return { success: false, message: "Insufficient liquidity" };
    }

    this.totalBorrowed += amount;
    this.updateInterestRate();

    return { success: true };
  }

  repay(amount) {
    this.totalBorrowed = Math.max(0, this.totalBorrowed - amount);
    this.updateInterestRate();
  }

  getAvailableLiquidity() {
    return this.totalDeposited - this.totalBorrowed;
  }

  getUtilization() {
    if (this.totalDeposited === 0) return 0;
    return this.totalBorrowed / this.totalDeposited;
  }

  updateInterestRate() {
    if (this.totalDeposited === 0) {
      this.interestRate = this.BASE_RATE;
      return;
    }

    const utilization = this.getUtilization();

    if (utilization <= this.OPTIMAL_UTILIZATION) {
      this.interestRate =
        this.BASE_RATE +
        (utilization / this.OPTIMAL_UTILIZATION) * this.SLOPE_1;
    } else {
      const excessUtilization =
        (utilization - this.OPTIMAL_UTILIZATION) /
        (1 - this.OPTIMAL_UTILIZATION);
      this.interestRate =
        this.BASE_RATE + this.SLOPE_1 + excessUtilization * this.SLOPE_2;
    }
  }

  getStats() {
    return {
      asset: this.asset,
      totalDeposited: this.totalDeposited,
      totalBorrowed: this.totalBorrowed,
      availableLiquidity: this.getAvailableLiquidity(),
      utilization: (this.getUtilization() * 100).toFixed(2) + "%",
      interestRate: (this.interestRate * 100).toFixed(2) + "%",
    };
  }
}

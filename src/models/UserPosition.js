// Tracks individual user's collateral and loans

export class UserPosition {
  constructor(userId) {
    this.userId = userId;
    this.collateral = [];
    this.loans = [];
    this.lastAccrualTime = Date.now();
  }

  addCollateral(asset, quantity) {
    const existing = this.collateral.find((c) => c.asset === asset);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.collateral.push({
        asset,
        quantity,
        depositTime: Date.now(),
      });
    }
  }

  removeCollateral(asset, quantity) {
    const col = this.collateral.find((c) => c.asset === asset);
    if (!col || col.quantity < quantity) {
      return { success: false, message: "Insufficient collateral" };
    }

    col.quantity -= quantity;

    if (col.quantity === 0) {
      this.collateral = this.collateral.filter((c) => c.asset !== asset);
    }

    return { success: true };
  }

  addLoan(asset, amount) {
    const existing = this.loans.find((l) => l.asset === asset);

    if (existing) {
      existing.principal += amount;
    } else {
      this.loans.push({
        asset,
        principal: amount,
        accruedInterest: 0,
        borrowTime: Date.now(),
      });
    }
  }

  reduceLoan(asset, amount) {
    const loan = this.loans.find((l) => l.asset === asset);
    if (!loan) {
      return { success: false, message: "No loan found" };
    }

    let remaining = amount;

    if (remaining >= loan.accruedInterest) {
      remaining -= loan.accruedInterest;
      loan.accruedInterest = 0;
      loan.principal -= remaining;
    } else {
      loan.accruedInterest -= remaining;
    }

    if (loan.principal <= 0.01) {
      this.loans = this.loans.filter((l) => l.asset !== asset);
    }

    return { success: true };
  }

  accrueInterest(pools) {
    const now = Date.now();
    const timeElapsed =
      (now - this.lastAccrualTime) / (1000 * 60 * 60 * 24 * 365);

    for (const loan of this.loans) {
      const pool = pools.get(loan.asset);
      if (!pool) continue;

      const interest = loan.principal * pool.interestRate * timeElapsed;
      loan.accruedInterest += interest;
    }

    this.lastAccrualTime = now;
  }

  getTotalDebt(asset) {
    const loan = this.loans.find((l) => l.asset === asset);
    if (!loan) return 0;
    return loan.principal + loan.accruedInterest;
  }

  hasLoans() {
    return this.loans.length > 0;
  }
}

# Ducat demo

A lending protocol using decentralized finance (defi) mechanics, adapted for traditional finance in Nigeria. An investor can borrow Nigerian Naira (NGN) or US Dollars (USD) by depositing stocks and ETFs as collateral. It solves the problem of needing local liquidity without selling dollar-denominated investments.

### Overview

This protocol implements core DeFi lending mechanics (over-collateralization, algorithmic interest rates, automated liquidations) but operates with traditional assets accessible to Nigerian investors through platforms like Risevest, Bamboo, and Trove.

[Architecture overview](./docs/architecture.md)

### Key Features

- **Multi-asset collateral**: Deposit US stocks (AAPL, MSFT, GOOGL, etc.) or ETFs (SPY, VOO, QQQ) as collateral
- **Dual currency loans**: Borrow in NGN or USD against your collateral
- **Dynamic interest rates**: Rates adjust automatically based on pool utilization (supply/demand)
- **Automated liquidations**: Positions are automatically liquidated when collateral value drops below safety thresholds
- **Real-time risk monitoring**: Continuous health factor calculations to protect both borrowers and lenders

### Use Case Example

A Nigerian investor has $2,000 worth of US stocks on an investment platfrom but needs ₦1,000,000 for a local business expense. Instead of selling their dollar investments and missing future gains, they:

1. Deposit their stocks as collateral
2. Borrow ₦1,000,000 at algorithmic interest rates
3. Use the Naira for their expense
4. Repay the loan later while keeping their US stock exposure

## Installation & Setup

### Prerequisites

- Node.js 18+ (for ES6 module support)

### Install

```bash
git clone https://github.com/odunlemi/ducat-demo
cd ducat-demo
```

### Run Demo

```bash
npm start
# or
node src/index.js
```

The demo shows a complete lending cycle:

1. Liquidity providers deposit NGN and USD
2. User deposits AAPL and SPY stocks as collateral
3. User borrows ₦1,000,000
4. Market crashes (prices drop 30%)
5. Position becomes unhealthy and gets liquidated

## Testing

```bash
npm test  # Run all tests

npm test:coverage
```

Test coverage goals:

- Core logic: 100%
- Models: 100%
- Services: 80%+ (mock external APIs)

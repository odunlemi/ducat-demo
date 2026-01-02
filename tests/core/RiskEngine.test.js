import { test } from "node:test";
import assert from "node:assert";
import { RiskEngine } from "../../src/core/RiskEngine.js";
import { AssetRegistry } from "../../src/services/AssetRegistry.js";
import { PriceOracle } from "../../src/services/PriceOracle.js";
import { UserPosition } from "../../src/models/UserPosition.js";

test("RiskEngine - should calculate collateral value with haircuts", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10); // 10 shares at $185 = $1850

  const collateralValue = riskEngine.calculateCollateralValue(position);

  // $1850 * (1 - 0.15 haircut) = $1572.50
  assert.strictEqual(collateralValue, 1572.5);
});

test("RiskEngine - should calculate loan value in USD", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addLoan("NGN", 1650000); // ₦1,650,000 = $1,000

  const loanValue = riskEngine.calculateLoanValue(position);

  assert.strictEqual(loanValue, 1000);
});

test("RiskEngine - should calculate borrowing power", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10); // Effective value after haircut: $1572.50

  const borrowingPower = riskEngine.calculateBorrowingPower(position);

  // $1572.50 / 1.3 = $1209.62
  assert.strictEqual(Math.round(borrowingPower.maxBorrowUSD), 1210);
});

test("RiskEngine - should calculate health factor", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10); // $1572.50 effective
  position.addLoan("USD", 1000); // $1000 loan

  const healthFactor = riskEngine.calculateHealthFactor(position);

  // $1572.50 / $1000 = 1.5725
  assert.ok(healthFactor > 1.5 && healthFactor < 1.6);
});

test("RiskEngine - should return infinity health factor with no loans", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10);

  const healthFactor = riskEngine.calculateHealthFactor(position);

  assert.strictEqual(healthFactor, Infinity);
});

test("RiskEngine - should identify liquidatable positions", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10); // $1572.50 effective
  position.addLoan("USD", 1400); // $1400 loan

  // Health factor: $1572.50 / $1400 = 1.123 < 1.15
  const canLiquidate = riskEngine.canLiquidate(position);

  assert.strictEqual(canLiquidate, true);
});

test("RiskEngine - should not liquidate healthy positions", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10); // $1572.50 effective
  position.addLoan("USD", 1000); // $1000 loan

  // Health factor: 1.5725 > 1.15
  const canLiquidate = riskEngine.canLiquidate(position);

  assert.strictEqual(canLiquidate, false);
});

test("RiskEngine - should calculate liquidation amount with bonus", () => {
  const registry = new AssetRegistry();
  const oracle = new PriceOracle();
  const riskEngine = new RiskEngine(registry, oracle);

  const liquidationAmount = riskEngine.calculateLiquidationAmount(1000);

  // $1000 * 1.05 = $1050
  assert.strictEqual(liquidationAmount, 1050);
});

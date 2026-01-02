import { test } from "node:test";
import assert from "node:assert";
import { LendingProtocol } from "../../src/core/LendingProtocol.js";

test("LendingProtocol - should initialize with pools", () => {
  const protocol = new LendingProtocol();

  const ngnPool = protocol.getPool("NGN");
  const usdPool = protocol.getPool("USD");

  assert.ok(ngnPool, "NGN pool should exist");
  assert.ok(usdPool, "USD pool should exist");
});

test("LendingProtocol - should allow liquidity provider deposits", () => {
  const protocol = new LendingProtocol();

  const result = protocol.depositToPool("lp1", "NGN", 1000000);

  assert.strictEqual(result.success, true);

  const pool = protocol.getPool("NGN");
  assert.strictEqual(pool.totalDeposited, 1000000);
});

test("LendingProtocol - should allow collateral deposits", () => {
  const protocol = new LendingProtocol();

  const result = protocol.depositCollateral("user1", "AAPL", 10);

  assert.strictEqual(result.success, true);
  assert.ok(result.borrowingPower.maxBorrowUSD > 0);
});

test("LendingProtocol - should reject invalid collateral", () => {
  const protocol = new LendingProtocol();

  const result = protocol.depositCollateral("user1", "INVALID", 10);

  assert.strictEqual(result.success, false);
});

test("LendingProtocol - should allow borrowing with sufficient collateral", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);
  protocol.depositCollateral("user1", "AAPL", 10);

  const result = protocol.borrow("user1", "NGN", 1000000);

  assert.strictEqual(result.success, true);
  assert.ok(result.healthFactor);
});

test("LendingProtocol - should reject borrowing without collateral", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);

  const result = protocol.borrow("user1", "NGN", 1000000);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, "No collateral deposited");
});

test("LendingProtocol - should reject over-borrowing", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "USD", 10000);
  protocol.depositCollateral("user1", "AAPL", 1); // Only ~$157 effective / 1.3 = ~$120 max borrow

  const result = protocol.borrow("user1", "USD", 5000);

  assert.strictEqual(result.success, false);
});

test("LendingProtocol - should allow loan repayment", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);
  protocol.depositCollateral("user1", "AAPL", 10);
  protocol.borrow("user1", "NGN", 1000000);

  const result = protocol.repay("user1", "NGN", 500000);

  assert.strictEqual(result.success, true);
  assert.ok(parseFloat(result.remainingDebt) < 1000000);
});

test("LendingProtocol - should liquidate unhealthy positions", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);
  protocol.depositCollateral("user1", "AAPL", 10);
  protocol.borrow("user1", "NGN", 1500000); // Borrow more to get closer to limit

  // Crash AAPL price significantly to make position unhealthy
  // Original: 10 shares * $185 = $1850 * 0.85 (haircut) = $1572.50 effective
  // After crash: 10 shares * $80 = $800 * 0.85 = $680 effective
  // Health factor: $680 / ($1500000 / 1650) = $680 / $909 = 0.75 < 1.15
  protocol.updatePrice("AAPL", 80, "USD");

  const result = protocol.liquidate("user1", "liquidator1", "NGN", 500000);

  assert.strictEqual(result.success, true);
  assert.ok(result.seized.length > 0);
});

test("LendingProtocol - should reject liquidating healthy positions", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);
  protocol.depositCollateral("user1", "AAPL", 10);
  protocol.borrow("user1", "NGN", 500000); // Conservative borrow

  const result = protocol.liquidate("user1", "liquidator1", "NGN", 500000);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, "Position is healthy");
});

test("LendingProtocol - should identify liquidation opportunities after price crash", () => {
  const protocol = new LendingProtocol();

  protocol.depositToPool("lp1", "NGN", 5000000);
  protocol.depositCollateral("user1", "AAPL", 10);
  protocol.borrow("user1", "NGN", 1500000);

  const result = protocol.updatePrice("AAPL", 100, "USD");

  assert.ok(result.liquidationOpportunities.length > 0);
});

test("LendingProtocol - should retrieve user position", () => {
  const protocol = new LendingProtocol();

  protocol.depositCollateral("user1", "AAPL", 10);

  const position = protocol.getPosition("user1");

  assert.ok(position);
  assert.strictEqual(position.collateral.length, 1);
  assert.ok(position.borrowingPower);
});

test("LendingProtocol - full cycle integration test", () => {
  const protocol = new LendingProtocol();

  // 1. LP deposits
  protocol.depositToPool("lp1", "NGN", 5000000);

  // 2. User deposits collateral
  protocol.depositCollateral("user1", "AAPL", 10);
  protocol.depositCollateral("user1", "SPY", 5);

  // 3. User borrows
  const borrowResult = protocol.borrow("user1", "NGN", 1000000);
  assert.strictEqual(borrowResult.success, true);

  // 4. User repays partially
  const repayResult = protocol.repay("user1", "NGN", 500000);
  assert.strictEqual(repayResult.success, true);

  // 5. Check final position
  const position = protocol.getPosition("user1");
  assert.ok(parseFloat(position.healthFactor) > 1.15);
});

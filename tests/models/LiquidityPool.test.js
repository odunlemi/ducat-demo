import { test } from "node:test";
import assert from "node:assert";
import { LiquidityPool } from "../../src/models/LiquidityPool.js";

test("LiquidityPool - should initialize with correct base rate", () => {
  const pool = new LiquidityPool("NGN", 0.18);

  assert.strictEqual(pool.asset, "NGN");
  assert.strictEqual(pool.BASE_RATE, 0.18);
  assert.strictEqual(pool.interestRate, 0.18);
  assert.strictEqual(pool.totalDeposited, 0);
  assert.strictEqual(pool.totalBorrowed, 0);
});

test("LiquidityPool - should accept deposits and update totals", () => {
  const pool = new LiquidityPool("NGN", 0.18);

  pool.deposit(1000000);

  assert.strictEqual(pool.totalDeposited, 1000000);
  assert.strictEqual(pool.getAvailableLiquidity(), 1000000);
});

test("LiquidityPool - should allow borrowing with sufficient liquidity", () => {
  const pool = new LiquidityPool("NGN", 0.18);
  pool.deposit(1000000);

  const result = pool.borrow(500000);

  assert.strictEqual(result.success, true);
  assert.strictEqual(pool.totalBorrowed, 500000);
  assert.strictEqual(pool.getAvailableLiquidity(), 500000);
});

test("LiquidityPool - should reject borrow with insufficient liquidity", () => {
  const pool = new LiquidityPool("NGN", 0.18);
  pool.deposit(1000000);

  const result = pool.borrow(1500000);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, "Insufficient liquidity");
});

test("LiquidityPool - should calculate utilization correctly", () => {
  const pool = new LiquidityPool("NGN", 0.18);
  pool.deposit(1000000);
  pool.borrow(750000);

  const utilization = pool.getUtilization();

  assert.strictEqual(utilization, 0.75); // 75%
});

test("LiquidityPool - should increase interest rate with higher utilization", () => {
  const pool = new LiquidityPool("NGN", 0.18);
  pool.deposit(1000000);

  const lowUtilRate = pool.interestRate;

  pool.borrow(750000); // 75% utilization (at optimal)
  const optimalRate = pool.interestRate;

  pool.borrow(200000); // Now at 95% utilization (950k / 1000k)
  const highUtilRate = pool.interestRate;

  assert.ok(
    optimalRate > lowUtilRate,
    "Interest rate should increase with utilization"
  );
  assert.ok(
    highUtilRate > optimalRate,
    "Interest rate should spike after optimal utilization"
  );
});

test("LiquidityPool - should reduce borrowed amount on repay", () => {
  const pool = new LiquidityPool("NGN", 0.18);
  pool.deposit(1000000);
  pool.borrow(500000);

  pool.repay(200000);

  assert.strictEqual(pool.totalBorrowed, 300000);
  assert.strictEqual(pool.getAvailableLiquidity(), 700000);
});

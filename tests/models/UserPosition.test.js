import { test } from "node:test";
import assert from "node:assert";
import { UserPosition } from "../../src/models/UserPosition.js";

test("UserPosition - should initialize empty", () => {
  const position = new UserPosition("user1");

  assert.strictEqual(position.userId, "user1");
  assert.strictEqual(position.collateral.length, 0);
  assert.strictEqual(position.loans.length, 0);
  assert.strictEqual(position.hasLoans(), false);
});

test("UserPosition - should add collateral", () => {
  const position = new UserPosition("user1");

  position.addCollateral("AAPL", 10);

  assert.strictEqual(position.collateral.length, 1);
  assert.strictEqual(position.collateral[0].asset, "AAPL");
  assert.strictEqual(position.collateral[0].quantity, 10);
});

test("UserPosition - should aggregate same asset collateral", () => {
  const position = new UserPosition("user1");

  position.addCollateral("AAPL", 10);
  position.addCollateral("AAPL", 5);

  assert.strictEqual(position.collateral.length, 1);
  assert.strictEqual(position.collateral[0].quantity, 15);
});

test("UserPosition - should remove collateral", () => {
  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10);

  const result = position.removeCollateral("AAPL", 5);

  assert.strictEqual(result.success, true);
  assert.strictEqual(position.collateral[0].quantity, 5);
});

test("UserPosition - should reject removing more collateral than available", () => {
  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10);

  const result = position.removeCollateral("AAPL", 15);

  assert.strictEqual(result.success, false);
});

test("UserPosition - should remove collateral entry when quantity reaches zero", () => {
  const position = new UserPosition("user1");
  position.addCollateral("AAPL", 10);

  position.removeCollateral("AAPL", 10);

  assert.strictEqual(position.collateral.length, 0);
});

test("UserPosition - should add loan", () => {
  const position = new UserPosition("user1");

  position.addLoan("NGN", 1000000);

  assert.strictEqual(position.loans.length, 1);
  assert.strictEqual(position.loans[0].asset, "NGN");
  assert.strictEqual(position.loans[0].principal, 1000000);
  assert.strictEqual(position.hasLoans(), true);
});

test("UserPosition - should aggregate same asset loans", () => {
  const position = new UserPosition("user1");

  position.addLoan("NGN", 1000000);
  position.addLoan("NGN", 500000);

  assert.strictEqual(position.loans.length, 1);
  assert.strictEqual(position.loans[0].principal, 1500000);
});

test("UserPosition - should calculate total debt including interest", () => {
  const position = new UserPosition("user1");
  position.addLoan("NGN", 1000000);
  position.loans[0].accruedInterest = 50000;

  const totalDebt = position.getTotalDebt("NGN");

  assert.strictEqual(totalDebt, 1050000);
});

test("UserPosition - should reduce loan on repayment", () => {
  const position = new UserPosition("user1");
  position.addLoan("NGN", 1000000);
  position.loans[0].accruedInterest = 50000;

  position.reduceLoan("NGN", 60000); // Pays interest first, then principal

  assert.strictEqual(position.loans[0].accruedInterest, 0);
  assert.strictEqual(position.loans[0].principal, 990000);
});

test("UserPosition - should remove loan when fully repaid", () => {
  const position = new UserPosition("user1");
  position.addLoan("NGN", 1000000);

  position.reduceLoan("NGN", 1000000);

  assert.strictEqual(position.loans.length, 0);
  assert.strictEqual(position.hasLoans(), false);
});

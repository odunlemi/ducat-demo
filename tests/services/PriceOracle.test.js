import { test } from "node:test";
import assert from "node:assert";
import { PriceOracle } from "../../src/services/PriceOracle.js";

test("PriceOracle - should initialize with default prices", () => {
  const oracle = new PriceOracle();

  const aaplPrice = oracle.get("AAPL");
  assert.ok(aaplPrice, "AAPL price should exist");
  assert.strictEqual(aaplPrice.currency, "USD");
});

test("PriceOracle - should update prices", () => {
  const oracle = new PriceOracle();

  oracle.update("AAPL", 200, "USD");

  const aaplPrice = oracle.get("AAPL");
  assert.strictEqual(aaplPrice.price, 200);
});

test("PriceOracle - should convert asset prices to USD", () => {
  const oracle = new PriceOracle();

  const aaplUSD = oracle.getInUSD("AAPL");
  assert.strictEqual(aaplUSD, 185); // Initial price
});

test("PriceOracle - should convert NGN to USD correctly", () => {
  const oracle = new PriceOracle();

  const ngnUSD = oracle.getInUSD("NGN");
  assert.ok(ngnUSD < 1, "NGN should be less than 1 USD");
  assert.strictEqual(ngnUSD, 1 / 1650); // 1 NGN = 1/1650 USD
});

test("PriceOracle - should convert between assets", () => {
  const oracle = new PriceOracle();
  oracle.update("AAPL", 185, "USD");
  oracle.update("NGN", 1650, "NGN");

  const aaplInNGN = oracle.convert("AAPL", "NGN", 1);

  assert.strictEqual(aaplInNGN, 185 * 1650); // 1 AAPL share in NGN
});

import { test } from "node:test";
import assert from "node:assert";
import { AssetRegistry } from "../../src/services/AssetRegistry.js";

test("AssetRegistry - should initialize with default assets", () => {
  const registry = new AssetRegistry();

  const aapl = registry.get("AAPL");
  assert.ok(aapl, "AAPL should be registered");
  assert.strictEqual(aapl.type, "US_STOCK");
});

test("AssetRegistry - should register new asset", () => {
  const registry = new AssetRegistry();

  registry.register("NFLX", "US_STOCK", "Netflix Inc.", false, true);

  const nflx = registry.get("NFLX");
  assert.strictEqual(nflx.symbol, "NFLX");
  assert.strictEqual(nflx.name, "Netflix Inc.");
});

test("AssetRegistry - should return risk params for asset type", () => {
  const registry = new AssetRegistry();

  const stockParams = registry.getRiskParams("US_STOCK");

  assert.strictEqual(stockParams.collateralRatio, 1.5);
  assert.strictEqual(stockParams.haircut, 0.15);
});

test("AssetRegistry - currencies should be borrowable", () => {
  const registry = new AssetRegistry();

  assert.strictEqual(registry.canBorrow("NGN"), true);
  assert.strictEqual(registry.canBorrow("USD"), true);
});

test("AssetRegistry - stocks should not be borrowable", () => {
  const registry = new AssetRegistry();

  assert.strictEqual(registry.canBorrow("AAPL"), false);
  assert.strictEqual(registry.canBorrow("SPY"), false);
});

test("AssetRegistry - stocks should be collateralizable", () => {
  const registry = new AssetRegistry();

  assert.strictEqual(registry.canCollateralize("AAPL"), true);
  assert.strictEqual(registry.canCollateralize("SPY"), true);
});

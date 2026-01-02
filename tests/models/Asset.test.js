import { test } from "node:test";
import assert from "node:assert";
import { Asset } from "../../src/models/Asset.js";

test("Asset - should create asset with correct properties", () => {
  const asset = new Asset("AAPL", "US_STOCK", "Apple Inc.", false, true);

  assert.strictEqual(asset.symbol, "AAPL");
  assert.strictEqual(asset.type, "US_STOCK");
  assert.strictEqual(asset.name, "Apple Inc.");
  assert.strictEqual(asset.canBorrow, false);
  assert.strictEqual(asset.canCollateralize, true);
});

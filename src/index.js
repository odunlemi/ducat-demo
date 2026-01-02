// Entry point for demo

import { LendingProtocol } from "./core/LendingProtocol.js";

console.log("=== MODULAR LENDING PROTOCOL WITH IMPORTS ===\n");

const protocol = new LendingProtocol();

console.log("1. Fund pools:");
console.log(protocol.depositToPool("lp1", "NGN", 5000000));
console.log(protocol.depositToPool("lp2", "USD", 10000));
console.log();

console.log("2. Deposit collateral:");
console.log(protocol.depositCollateral("user1", "AAPL", 10));
console.log(protocol.depositCollateral("user1", "SPY", 5));
console.log();

console.log("3. Borrow NGN:");
console.log(protocol.borrow("user1", "NGN", 1000000));
console.log();

console.log("4. Market crash:");
protocol.updatePrice("AAPL", 130, "USD");
const crash = protocol.updatePrice("SPY", 360, "USD");
console.log(crash);
console.log();

console.log("5. Liquidate:");
console.log(protocol.liquidate("user1", "liquidator1", "NGN", 500000));

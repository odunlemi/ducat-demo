// Base asset class

export class Asset {
  constructor(symbol, type, name, canBorrow, canCollateralize) {
    this.symbol = symbol;
    this.type = type;
    this.name = name;
    this.canBorrow = canBorrow;
    this.canCollateralize = canCollateralize;
  }
}

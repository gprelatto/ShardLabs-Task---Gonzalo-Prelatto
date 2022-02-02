import { BigNumber, Contract } from "ethers";
import { NumberOrString } from "./Decimal";
import { ContractBase } from "./ContractBase";
import { ERC20Matic } from "./ERC20Matic";
import { TokenInfo } from "../pool-utils/TokenInfo";
import { PoLidoContract } from "./PoLidoContract";

export class PoLidoMock extends PoLidoContract {
  constructor(contractName:string, pool:Contract, asset:ERC20Matic) {
    super(contractName, pool, asset);
  }

  /**
   * @param ASSET ASSET token info (IGNORED)
   * @param YIELD YIELD token info
   * @param initialRate Initial interest rate
   */
  static async create(ASSET:TokenInfo, YIELD:TokenInfo, initialRate:Number): Promise<PoLidoMock> {
    const asset = new ERC20Matic();
    const pool = await ContractBase.deployContract(
      "PoLidoMock", YIELD.decimals, YIELD.name, YIELD.symbol
    );
    const polido = new PoLidoMock("PoLidoMock", pool, asset);
    if (initialRate != 1.0) {
      await polido.setInterestRate(initialRate);
    }
    return polido;
  }

  async setInterestRate(interestRate:NumberOrString): Promise<void> {
    let totalMATICSupply:BigNumber = await this.contract.totalSupply();
    // total ETH is 0, so we must actually deposit something, otherwise we can't manipulate the rate
    if (totalMATICSupply.isZero()) {
      totalMATICSupply = this.toBigNum(1000);
      await this.contract._setSharesAndEthBalance(this.toBigNum(1000), totalMATICSupply); // 1.0 rate
    }

    // figure out if newRate requires a change of stMATIC
    const curRate = await this.interestRateBigNum();
    const newRate = this.toBigNum(interestRate);
    const ONE = this.toBigNum(1.0);
    const difference = newRate.mul(ONE).div(curRate).sub(ONE);
    if (difference.isZero())
      return;

    const totalShares:BigNumber = await this.contract.getTotalShares();
    const change = totalMATICSupply.mul(difference).div(ONE);
    const newETHSupply = totalMATICSupply.add(change);
    await this.contract._setSharesAndEthBalance(totalShares, newETHSupply);
  }
}

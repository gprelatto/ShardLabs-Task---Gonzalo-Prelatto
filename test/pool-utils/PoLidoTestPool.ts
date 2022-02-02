import { PoolTestFixture, TempusAMMParams } from "./PoolTestFixture";
import { ContractBase, Signer } from "../utils/ContractBase";
import { TempusPool, PoolType } from "../utils/TempusPool";
import { TokenInfo } from "./TokenInfo";
import { ethers, getUnnamedAccounts } from "hardhat";
import { PoLidoContract } from "../utils/PoLidoContract";
import { PoLidoMock } from "../utils/PoLidoMock";
import { PoLidoFork } from "../utils/PoLidoFork";
import { Transaction } from "ethers";

export class PoLidoTestPool extends PoolTestFixture {
  polido:PoLidoContract;
  ASSET_TOKEN:TokenInfo;
  YIELD_TOKEN:TokenInfo;
  constructor(ASSET_TOKEN:TokenInfo, YIELD_TOKEN:TokenInfo, integration:boolean) {
    super(PoolType.PoLido, /*acceptsEther*/true, /*yieldPeggedToAsset:*/true, integration);
    this.ASSET_TOKEN = ASSET_TOKEN;
    this.YIELD_TOKEN = YIELD_TOKEN;
  }
  public setInterestRate(rate:number): Promise<void> {
    return this.polido.setInterestRate(rate);
  }
  async forceFailNextDepositOrRedeem(): Promise<void> {
    await this.polido.contract.setFailNextDepositOrRedeem(true);
  }
  async getSigners(): Promise<[Signer,Signer,Signer]> {
    if (this.integration) {
      // TODO: implement `owner` for Lido integration tests
      const [owner] = await ethers.getSigners();
      const [account1,account2] = await getUnnamedAccounts();
      return [
        owner,
        await ethers.getSigner(account1),
        await ethers.getSigner(account2)
      ]
    } else {
      const [owner,user,user2] = await ethers.getSigners();
      return [owner,user,user2];
    }
  }
  async deposit(user:Signer, amount:number): Promise<void> {
    await this.polido.submit(user, amount);
  }
  async createWithAMM(params:TempusAMMParams): Promise<TempusPool> {
    return await this.initPool(params, this.YIELD_TOKEN.name, this.YIELD_TOKEN.symbol, async () => {
      if (this.integration) {
        return await PoLidoFork.create(this.ASSET_TOKEN, this.YIELD_TOKEN, this.initialRate);
      } else {
        return await PoLidoMock.create(this.ASSET_TOKEN, this.YIELD_TOKEN, this.initialRate);
      }
    }, (pool:ContractBase) => {
      this.polido = <PoLidoContract>pool;
      this.asset = this.polido.asset;
      this.ybt = this.polido.yieldToken;
    });
  }
}

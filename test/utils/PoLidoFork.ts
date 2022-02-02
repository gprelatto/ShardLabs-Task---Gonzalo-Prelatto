import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { NumberOrString, parseDecimal } from "./Decimal";
import { setStorageField } from "./Utils";
import { ERC20Matic } from "./ERC20Matic";
import { TokenInfo } from "../pool-utils/TokenInfo";
import { PoLidoContract } from "./PoLidoContract";

export class PoLidoFork extends PoLidoContract {
  lidoOracle:Contract;

  constructor(contractName:string, pool:Contract, asset:ERC20Matic, oracle:Contract) {
    super(contractName, pool, asset);
    this.lidoOracle = oracle;
  }

  /**
   * @param YIELD YIELD token info
   * @param initialRate Initial interest rate
   */
  static async create(_:TokenInfo, YIELD:TokenInfo, initialRate:Number): Promise<PoLidoFork> {
    const asset = new ERC20Matic();
    const pool = (await ethers.getContract(YIELD.deploymentName!));
    const oracle = await ethers.getContract('LidoOracle');
    const polido = new PoLidoFork(YIELD.deploymentName, pool, asset, oracle);
    await polido.setInterestRate(initialRate);
    return polido;
  }

  async getBeaconBalance(): Promise<BigNumber> {
    // { depositedValidators, beaconValidators, beaconBalance }
    const { beaconBalance } = await this.contract.getBeaconStat();
    return beaconBalance;
  }

  /**
   * In order to set Lido's interest rate to the given value we change
   * the 2 parameters in Lido's interest rate formula (TotalPoolEther / TotalShares).
   * We set TotalPoolEther to the given interestRate value (scaled up to 1e36, as explained below)
   * and TotalShares to 1 (scaled up to 1e36 as well). This results in Lido's internal interest rate calculation
   * to be - TargetInterestRate / 1 (which equals TargetInterestRate of course).
   * 
   * @dev we scale up everything to 1e36 because the way we change TotalPoolEther is by changing the internal cached 
   * beaconBalance value (which is a component of TotalETHSupply), and by scaling everything up we avoid the potential situation where we need to set beaconBalance
   * to a negative value to achieve the desired TargetETHSupply.
   */
  async setInterestRate(interestRate:NumberOrString): Promise<void> {
    const totalMATICSupply:BigNumber = await this.contract.totalSupply();
    
    const targetMATICSupply = parseDecimal(interestRate, 36);
    const maticSupplyDiff = targetMATICSupply.sub(totalMATICSupply);

    const beaconBalance = await this.getBeaconBalance();
    const newBeaconBalance:BigNumber = beaconBalance.add(maticSupplyDiff);
    
    await setStorageField(this.contract, "polido.PoLido.beaconBalance", newBeaconBalance);
    await setStorageField(this.contract, "polido.StMATIC.totalShares", parseDecimal('1', 36));
  }
}

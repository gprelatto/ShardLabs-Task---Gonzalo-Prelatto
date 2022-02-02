import { ethers } from "hardhat";
import { NumberOrString, DecimalConvertible } from "./Decimal";
import { SignerOrAddress, Signer, addressOf } from "./ContractBase";
import { IERC20 } from "./IERC20";

/**
 * Typed wrapper for Ether which implements ERC20,
 * so that we can simplify tests on native ETH based pools
 */
export class ERC20Matic extends DecimalConvertible implements IERC20 {
  // Address of this contract - ETH is Zero address
  address = '0x0000000000000000000000000000000000000000';

  constructor() {
    super(18);
  }

  /** @return ERC20 name of this contract */
  async name(): Promise<string> { return "Matic"; }

  /** @return ERC20 symbol of this contract */
  async symbol(): Promise<string> { return "MATIC"; }

  /**
   * @returns Total supply of this ERC20 token as a decimal, such as 10.0
   */
  async totalSupply(): Promise<NumberOrString> { return 117_766_454; }

  /**
   * @param account ERC20 account's address
   * @returns Balance of ERC20 address in decimals, eg 2.0
   */
  async balanceOf(account:SignerOrAddress): Promise<NumberOrString> {
    const balance = await ethers.provider.getBalance(addressOf(account));
    return this.fromBigNum(balance);
  }

  /**
   * @dev Moves `amount` tokens from the sender's account to `recipient`.
   * @param sender The sender/caller of this transfer
   * @param recipient ERC20 transfer recipient's address
   * @param amount Amount of tokens to send in contract decimals, eg 2.0 or "0.00001"
   */
  async transfer(sender:SignerOrAddress, recipient:SignerOrAddress, amount:NumberOrString): Promise<any> {
    const signer = <Signer>sender;
    return signer.sendTransaction({
      from: signer.address,
      to: addressOf(recipient),
      value: this.toBigNum(amount)
    });
  }

  /**
   * @param owner ERC20 owner's address
   * @param spender ERC20 spender's address
   * @returns The remaining number of tokens that `spender` will be allowed to 
   * spend on behalf of `owner` through {transferFrom}. This is zero by default.
   */
  async allowance(owner:SignerOrAddress, spender:SignerOrAddress): Promise<NumberOrString> {
    return 0;
  }
  
  /**
   * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
   * @param caller The caller who is sending this approve
   * @param spender ERC20 approve's, spender's address
   * @param amount Amount of tokens to approve in contract decimals, eg 2.0 or "0.00001"
   */
  async approve(caller:SignerOrAddress, spender:SignerOrAddress, amount:NumberOrString): Promise<any> {
    return;
  }

  /**
   * @dev Moves `amount` tokens from `sender` to `recipient` using the
   * allowance mechanism. `amount` is then deducted from the caller's allowance.
   * @param sender ERC20 transferFrom sender's address
   * @param recipient ERC20 transferFrom recipient's address
   * @param amount Amount of tokens to send in contract decimals, eg 2.0 or "0.00001"
   */
  async transferFrom(sender:SignerOrAddress, recipient:SignerOrAddress, amount:NumberOrString): Promise<any> {
    return this.transfer(sender, recipient, amount);
  }
}

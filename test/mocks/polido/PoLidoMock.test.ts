import { expect } from "chai";
import { PoLidoMock } from "../../utils/PoLidoMock";
import { Signer } from "../../utils/ContractBase";
import { expectRevert } from "../../utils/Utils";
import { PoolType } from "../../utils/TempusPool";
import { PoolTestFixture } from "../../pool-utils/PoolTestFixture";
import { describeForEachPool, integrationExclusiveIt as it } from "../../pool-utils/MultiPoolTestSuite";

describeForEachPool.type("PoLido Mock", [PoolType.PoLido], (testPool:PoolTestFixture) =>
{
  let owner:Signer, user:Signer;
  let polido:PoLidoMock;

  beforeEach(async () =>
  {
    await testPool.createDefault();
    polido = (testPool as any).polido;

    [owner, user] = testPool.signers;
  });

  describe("Deploy", () =>
  {
    it("Should have correct initial values", async () =>
    {
      expect(await polido.totalSupply()).to.equal(0.0); // alias to getTotalPooledEther()
      expect(await polido.getTotalShares()).to.equal(0.0);
      expect(await polido.getPooledEthByShares(1.0)).to.equal(1.0);
      expect(await polido.getSharesByPooledEth(1.0)).to.equal(1.0);
    });
  });

  describe("Submit", () =>
  {
    it("Should store and track balance similar to ERC20 tokens BEFORE buffer deposit", async () =>
    {
      await polido.sendToContract(owner, 4.0); // join Lido
      await polido.submit(user, 2.0); // join Lido

      expect(await polido.totalSupply()).to.equal(6.0); // alias to getTotalPooledEther()
      expect(await polido.getTotalShares()).to.equal(6.0);

      expect(await polido.balanceOf(owner)).to.equal(4.0);
      expect(await polido.balanceOf(user)).to.equal(2.0);

      expect(await polido.sharesOf(owner)).to.equal(4.0);
      expect(await polido.sharesOf(user)).to.equal(2.0);
    });

    it("Should reject ZERO deposit", async () =>
    {
      (await expectRevert(polido.submit(user, 0.0))).to.equal("ZERO_DEPOSIT");
    });

    it("Should deposit in 32matic chunks", async () =>
    {
      await polido.submit(owner, 8.0);
      await polido.depositBufferedEther2(1);
      expect(await polido.totalSupply()).to.equal(8.0);
      expect(await polido.sharesOf(owner)).to.equal(8.0);
      
      await polido.submit(owner, 32.0);
      await polido.depositBufferedEther();
      expect(await polido.totalSupply()).to.equal(40.0);
      expect(await polido.sharesOf(owner)).to.equal(40.0);
    });

    it("Should increase account balances after rewards in fixed proportion", async () =>
    {
      const initial = 50.0;
      await polido.submit(owner, initial*0.2);
      await polido.submit(user, initial*0.8);
      await polido.depositBufferedEther();

      const rewards = 1.0;
      const minted = 0.098231827111984282;
      await polido.pushBeaconRewards(owner, 1, rewards);
      //await lido.printState("after pushBeaconRewards (1 MATIC)");

      expect(await polido.totalSupply()).to.equal(initial + rewards);
      expect(await polido.getTotalShares()).to.equal('50.098231827111984282');

      const ownerBalance = await polido.balanceOf(owner);
      const userBalance  = await polido.balanceOf(user);
      expect(ownerBalance).to.equal(10.18);
      expect(userBalance).to.equal(40.72);
    });
  });

  describe("Withdraw", async () =>
  {
    it("Should be allowed to withdraw original deposit", async () =>
    {
      await polido.submit(owner, 32.0);
      await polido.depositBufferedEther();
      await polido.submit(user, 33.0);
      await polido.submit(user, 33.0);

      // Three validators and total balance of 34, i.e accrued 2 eth of yield
      await polido.pushBeacon(owner, 1, 34.0);
      expect(await polido.sharesOf(owner)).to.equal(32.0);
      expect(await polido.sharesOf(user)).to.equal(66.0);

      // Withdraw some ether
      await polido.withdraw(owner, 32.0);
      expect(await polido.sharesOf(owner)).to.equal(0.0);
      expect(await polido.sharesOf(user)).to.equal(66.0);

      (await expectRevert(polido.withdraw(owner, 100.0)))
        .to.equal("Can only withdraw up to the buffered matic.");

      (await expectRevert(polido.withdraw(owner, 1.0)))
        .to.equal("BURN_AMOUNT_EXCEEDS_BALANCE");
    });

    it("Should have different redeemable MATIC with exchangeRate 1.25", async () =>
    {
      await polido.submit(user, 32.0);
      expect(await polido.sharesOf(user)).to.equal(32.0);
      
      await polido.setInterestRate(1.25);
      expect(await polido.interestRate()).to.equal(1.25);

      const redeemable = await polido.getPooledEthByShares(10);
      expect(redeemable).to.equal(12.5, "redeemable ETH should increase by 1.25x with interestRate 1.25x");
    });

    it("Should revert if underlying pool has a random error", async () =>
    {
      await polido.submit(owner, 32.0);
      await polido.contract.setFailNextDepositOrRedeem(true);
      (await expectRevert(polido.withdraw(owner, 32.0))).to.not.equal('success');
    });
  });
});

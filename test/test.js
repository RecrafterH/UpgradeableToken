const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { formatEther, parseEther } = require("ethers/lib/utils");
const { ethers, upgrades } = require("hardhat");

describe("unit test", function () {
  async function deployFixture() {
    const [owner, dev, user1] = await ethers.getSigners();
    const TokenContract = await ethers.getContractFactory("TokenV1");
    const proxy = await upgrades.deployProxy(TokenContract, [5, dev.address]);
    await proxy.deployed();

    const implementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxy.address);

    return { implementationAddress, owner, dev, user1, proxy };
  }

  it("Should send half of the fee to the dev", async () => {
    const { dev, user1, proxy } = await loadFixture(deployFixture);

    const tx = await proxy.transfer(user1.address, parseEther("100000"));
    await tx.wait();
    let balance = (await proxy.balanceOf(dev.address)).toString();
    balance = await formatEther(balance);
    expect(balance.toString()).to.equal("5000.0");
    balance = (await proxy.balanceOf(user1.address)).toString();
    balance = formatEther(balance);
    expect(balance.toString()).to.equal("95000.0");
  });
  describe("changing Version", () => {
    async function afterChangeVersion() {
      const deployValue = await deployFixture();
      const { owner, dev, user1, proxy } = deployValue;
      const proxyAddress = proxy.address;
      const TokenV2 = await ethers.getContractFactory("TokenV2");
      const upgraded = await upgrades.upgradeProxy(proxyAddress, TokenV2);
      const implementationAddress =
        await upgrades.erc1967.getImplementationAddress(proxyAddress);

      return { proxyAddress, owner, dev, user1, proxy, upgraded };
    }
    it("Should burn if someone sends a transaction", async () => {
      const { dev, user1, upgraded } = await loadFixture(afterChangeVersion);
      const tx = await upgraded.transfer(user1.address, parseEther("100000"));
      let balance = (await upgraded.balanceOf(dev.address)).toString();
      balance = await formatEther(balance);
      expect(balance.toString()).to.equal("2500.0");
      let balance1 = (await upgraded.balanceOf(user1.address)).toString();
      balance1 = await formatEther(balance1);
      expect(balance1.toString()).to.equal("95000.0");
    });
    it("Should decrease the total supply because of the transaction burn", async () => {
      const { user1, upgraded } = await loadFixture(afterChangeVersion);
      const tx = await upgraded.transfer(user1.address, parseEther("100000"));
      let supply = await upgraded.totalSupply();
      supply = await formatEther(supply.toString());
      expect(supply.toString()).to.equal("997500.0");
    });
    it("Burning reduces the totalSupply", async () => {
      const { upgraded } = await loadFixture(afterChangeVersion);
      const tx = await upgraded.burn(parseEther("500000"));
      let supply = await upgraded.totalSupply();
      supply = await formatEther(supply.toString());
      expect(supply.toString()).to.equal("500000.0");
    });
    it("Lets other people burn from you", async () => {
      const { owner, user1, upgraded } = await loadFixture(afterChangeVersion);
      const tx = await upgraded.approve(user1.address, parseEther("100000"));
      await tx.wait();
      const tx1 = await upgraded
        .connect(user1)
        .burnFrom(owner.address, parseEther("100000"));
      await tx1.wait();
      let supply = await upgraded.totalSupply();
      supply = await formatEther(supply.toString());
      expect(supply.toString()).to.equal("900000.0");
    });
    it("Lets only the owner change the fee", async () => {
      const { user1, upgraded } = await loadFixture(afterChangeVersion);
      await upgraded.changeFee(50);
      const tx = await upgraded.transfer(user1.address, parseEther("100000"));
      await tx.wait();
      let balance = await upgraded.balanceOf(user1.address);
      balance = await formatEther(balance.toString());
      expect(balance.toString()).to.equal("50000.0");
      let supply = await upgraded.totalSupply();
      supply = await formatEther(supply.toString());
      expect(supply.toString()).to.equal("975000.0");
    });
    it("Lets noone else change the fee", async () => {
      const { user1, upgraded } = await loadFixture(afterChangeVersion);
      expect(upgraded.connect(user1).changeFee(10)).to.be.revertedWith(
        "You are not the boss"
      );
    });
    it("Lets approve and transferfrom", async () => {
      const { owner, user1, upgraded } = await loadFixture(afterChangeVersion);
      const tx = await upgraded.approve(user1.address, parseEther("100000"));
      await tx.wait();
      const tx1 = await upgraded
        .connect(user1)
        .transferFrom(owner.address, user1.address, parseEther("100000"));
      await tx1.wait();
      let balance = await upgraded.balanceOf(user1.address);
      balance = formatEther(balance.toString());
      expect(balance.toString()).to.equal("100000.0");
    });
    describe("changing to V3", () => {
      async function changeToV3() {
        const deployValue = await afterChangeVersion();

        const { owner, dev, user1, upgraded } = deployValue;
        const proxyAddress = upgraded.address;
        const TokenV3 = await ethers.getContractFactory("TokenV3");
        const tokenV3 = await upgrades.upgradeProxy(proxyAddress, TokenV3);
        const implementationAddress =
          await upgrades.erc1967.getImplementationAddress(proxyAddress);

        return { proxyAddress, owner, dev, user1, tokenV3 };
      }
      it("Applies fees to transferFrom", async () => {
        const { owner, user1, tokenV3, dev } = await loadFixture(changeToV3);
        const tx = await tokenV3.approve(user1.address, parseEther("100000"));
        await tx.wait();
        const tx1 = await tokenV3
          .connect(user1)
          .transferFrom(owner.address, user1.address, parseEther("100000"));
        await tx1.wait();
        let balance = await tokenV3.balanceOf(user1.address);
        balance = formatEther(balance.toString());
        expect(balance.toString()).to.equal("95000.0");
        balance = await tokenV3.balanceOf(dev.address);
        balance = formatEther(balance.toString());
        expect(balance.toString()).to.equal("2500.0");
        balance = await tokenV3.balanceOf(owner.address);
        balance = formatEther(balance.toString());
        expect(balance.toString()).to.equal("900000.0");
      });
      it("Reverts if anyone expects the boss calls changeFee", async () => {
        const { user1, tokenV3 } = await loadFixture(changeToV3);

        expect(tokenV3.connect(user1).changeFee(20)).to.be.revertedWith(
          "You are not the boss"
        );
      });
      it("Lets the boss change the fee", async () => {
        const { user1, dev, tokenV3 } = await loadFixture(changeToV3);
        const tx = await tokenV3.changeFee(20);
        await tx.wait();
        let fee = await tokenV3.getFee();
        expect(fee.toString()).to.equal("20");
        const tx1 = await tokenV3.transfer(user1.address, parseEther("100000"));
        await tx1.wait();
        let balance = await tokenV3.balanceOf(user1.address);
        balance = formatEther(balance.toString());
        expect(balance.toString()).to.equal("80000.0");
        balance = await tokenV3.balanceOf(dev.address);
        balance = formatEther(balance.toString());
        expect(balance.toString()).to.equal("10000.0");
      });
      it("Let only the boss change the boss", async () => {
        const { dev, tokenV3, user1 } = await loadFixture(changeToV3);
        expect(
          tokenV3.connect(user1).changeBoss(dev.address)
        ).to.be.revertedWith("You are not the boss");
        const tx = await tokenV3.changeBoss(dev.address);
        await tx.wait();
        const boss = await tokenV3.getBoss();
        expect(boss).to.equal(dev.address);
      });
    });
  });
});

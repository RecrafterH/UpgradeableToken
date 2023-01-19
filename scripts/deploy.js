const { parseEther } = require("ethers/lib/utils");
const { ethers, upgrades } = require("hardhat");

const main = async () => {
  const TokenV1 = await ethers.getContractFactory("TokenV1");
  const proxy = await upgrades.deployProxy(TokenV1, [
    5,
    "0x2Df3EBe4280dC7262D9644ccd5dBC41c0DE293c8",
  ]);
  await proxy.deployed();

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxy.address
  );

  console.log("Proxy contract address: " + proxy.address);

  console.log("Implementation contract address: " + implementationAddress);
};
//Proxy contract address: 0x306E45196fAaeA720E0179A29cA6799149fBA2F1
//Implementation contract address: 0xDf4d00514EbC16b1D49a4384FbA155746f67C59e

main();

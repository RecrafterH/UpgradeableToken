const { ethers, upgrades } = require("hardhat");

const proxyAddress = "0x306E45196fAaeA720E0179A29cA6799149fBA2F1";

const main = async () => {
  const TokenV3 = await ethers.getContractFactory("TokenV3");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TokenV3);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("Implementation contract address: " + implementationAddress);
};
//0x1C2aC01E77ceC51F31335c26E19fD2022239846d
main();

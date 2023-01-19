const { ethers, upgrades } = require("hardhat");

const proxyAddress = "0x306E45196fAaeA720E0179A29cA6799149fBA2F1";

const main = async () => {
  const TokenV2 = await ethers.getContractFactory("TokenV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, TokenV2);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  //console.log("The current contract owner is: " + upgraded.owner());
  console.log("Implementation contract address: " + implementationAddress);
};
//0x0Aa2cEf0ed5fc48de46880017007399e6d4F032C
main();

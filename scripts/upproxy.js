async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const proxyAddress = '0x84cCc2abc36fF37A2b5097a2F8EbE6b676279245';
    const SealUpgradeable = await ethers.getContractFactory("SealUpgradeable");
    
    console.log("Preparing upgrade...");
    const SealUpgradeableAddress = await upgrades.upgradeProxy(proxyAddress, SealUpgradeable);
    console.log("SealUpgradeable at:", SealUpgradeableAddress);
  }

  main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

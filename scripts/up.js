async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    //這裡注意getContractFactory後面放的是合約名稱 
    //非.sol的檔案名稱而是要deploy Contract (範例.sol裡面有有三個Contract)
    // const Token = await ethers.getContractFactory("WETH");
      
    // //注意這裡因為Child有constructor 所以deploy後面需要帶入參數
    // const token = await Token.deploy();

    const Counter = await ethers.getContractFactory("SealUpgradeable");
    const token = await upgrades.deployProxy(Counter);
    await token.deployed();
    //若沒有constructor的合約直接以下這行即可
    //const token = await Token.deploy();
  
    console.log("Token address:", token.address);
   
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
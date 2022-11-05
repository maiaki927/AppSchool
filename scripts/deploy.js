async function main() {
  const [deployer] = await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x364d6D0333432C3Ac016Ca832fb8594A8cE43Ca6"]}
  )
  //await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  //這裡注意getContractFactory後面放的是合約名稱 
  //非.sol的檔案名稱而是要deploy Contract (範例.sol裡面有有三個Contract)
  const Token = await ethers.getContractFactory("WETH");
    
  //注意這裡因為Child有constructor 所以deploy後面需要帶入參數
  const token = await Token.deploy();
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
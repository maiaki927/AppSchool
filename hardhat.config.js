const { version } = require("chai");

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config()

//重要:以下這些內容你要打包還放雲幹麻的，請自己把所有KEY丟放到外部env檔案喔喔喔喔

// 辦帳號(免費) https://www.alchemyapi.io
// 辦好帳號把KEY抓過來貼
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

//放Metamask帳戶私鑰 
//記得選一個不放錢的帳戶（但你要用的鏈要有錢當gas）
//這裡可以挖goerli的Gas  https://goerli-faucet.pk910.de/
const PRIVATE_KEY =  process.env.PRIVATE_KEY;

//辦帳號(免費) https://etherscan.io/
//辦好之後申請一個API 把API KEY貼過來
const ETHERSCAN_API_KEY =  process.env.ETHERSCAN_API_KEY;

module.exports = {
  //要跟你要編譯的solidity程式上寫的版本一樣阿
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true, runs: 200
      }
    }
  },
  networks: {


    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 15815693,
        enabled: true
      }

    },

    //這裡用goerli測試鏈 有需要的話記得自己換
    // goerli: {
    //   url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    //   accounts: [PRIVATE_KEY]
    // }
  }, etherscan: {
    apiKey: {
      goerli: ETHERSCAN_API_KEY
    }
  }
};
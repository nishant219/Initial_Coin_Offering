const {ethers}=require("hardhat");
require("dotenv").config();
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main(){
  // Address of the Crypto Devs NFT contract that you deployed previously from constants folder
  const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  const cryptoDevsTokenContract = await ethers.getContractFactory("CryptoDevToken");
  // deploy the contract
  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(cryptoDevsNFTContract);
  await deployedCryptoDevsTokenContract.deployed();
  // print the address of the deployed contract
  console.log("Crypto Devs Token Contract Address:",deployedCryptoDevsTokenContract.address);

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

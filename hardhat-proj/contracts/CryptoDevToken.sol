// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    ICryptoDevs CryptoDevsNFT; //instance of interface
    mapping(uint256 => bool) public tokenIdsClaimed; //tokenId is claimed or not
    uint256 public constant tokensPerNft = 10 * 10 ** 18; //10 tokens per nft to mint
    uint256 public constant tokenPrice=0.001 ether;
    uint256 public constant maxTotalSupply= 10000 * 10**18;

    //
    constructor(address _CryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNFT = ICryptoDevs(_CryptoDevsContract); //pass value in interface
    }

    //fun for public mint --after nft over
    function mint(uint256 amount) public payable{
        uint256 _requiredAmount=amount*tokenPrice;  //(no.Of Tokens)*(price of 1 token)
        require(msg.value>=_requiredAmount, "entered ETH value is not correct");
        uint256 amountWithDecimal=amount * 10**18;  //amount of tokens user want to mint
        //totalSupply - amount of tokens minted till now
        // total tokens + amount <= 10000, otherwise revert the transaction
        require(totalSupply()+amountWithDecimal<=maxTotalSupply, "Exceed the max total supply available");
        // call the internal function from Openzeppelin's ERC20 contract
        _mint(msg.sender, amountWithDecimal);
    }


    //
    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender); //no of nft that address have
        require(balance > 0, "You dont own any Crypto_Devs NFT");
        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i); //for each nft(index) we are getting tokenId
            //if nft for curr tokenId is not claimed
            if (!tokenIdsClaimed[tokenId]) {
                amount++;
                tokenIdsClaimed[tokenId] = true; //now claimed
            }
        }
        require(amount > 0, "You have already claimed all your tokens");
        //if amount>0then only mint
        _mint(msg.sender, amount * tokensPerNft); //fun from erc20
    }

//
       function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw; contract balance empty");
        
        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
      }

     // Function to receive Ether. msg.data must be empty
      receive() external payable {}

      // Fallback function is called when msg.data is not empty
      fallback() external payable {}


}

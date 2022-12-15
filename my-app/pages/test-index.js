import Head from "next/head";
import { BigNumber, Contract, providers, utils } from "ethers";
import { useRef, useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
// import ConnectToStarzWallet from "web3modal/dist/providers/connectors/starzwallet";
// import { Web3Provider } from "@ethersproject/providers";
import { BigNumber, Contract, utils } from "ethers";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "../constants";



export default function main() {
    const zero=BigNumber.from(0);
    //to keep track of wallet connected or not 
    const[walletConnected, setWalletConnected]=useState(false);
    //useRef instance is alive until page is open...we want user to login until page is open thats why useRef
    const web3ModalRef=useRef(); 
    //contract returning bignumber thats why zero=bigNumber 
    const [tokensMinted, setTokensMinted]=useState(zero);
    const[balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens]=useState(zero);
    //to keep track of tokens user mint
    const [tokenAmount, setTokenAmount]=useState(zero);
    const [loading, setLoading]=useState(false);
    //no of tokens user can claimed
    const [tokensToBeClaimed, setTokensToBeClaimed]=useState(zero);



    //getSignerORProvider-helper fun checks whether user connected to correct network
    //provider used to read the values when state changes and get values that not rreq state change
    const getProviderOrSigner=async(needSigner=false)=>{
        
        //this going to connect with cuee account that user is logged in 
        const provider=await web3ModalRef.current.content();
        //Web3Provider is class in provider which has some functionalities
        const web3Provider= new provider.Web3Provider(provider);

        
    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    //if signer needed 
    if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;

    }


    //fun to connect wallet
    const connectWallet=async()=>{
        try{
            await getProviderOrSigner(); //fun call
            setWalletConnected(true); //update state
        }catch(err){
            console.log(err);
        }

    }
     
    
//
    const getBalanceOfCryptoDevTokens=async()=>{
      try{
        const provider= await getProviderOrSigner();
        const tokenContract=new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider );
        
        const signer=getProviderOrSigner(true);  //for address signer required
        const address=signer.getAddress(); //for balance address required
        const balance=await tokenContract.balanceof(address); //balanceof fun from contract
        setBalanceOfCryptoDevTokens(balance);
      }catch(err){
        console.log(err);
      }
    }    


//fun to know tokens that user can actually claimed
//we will need NFT contract so we can determine no. of tokens from no. of NFT user holds
    const getTokensToBeClaimed=async()=>{
      try{
        const provider=await getProviderOrSigner();
        const nftContract=new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
        //to get balance -we neeed address- to get address -we need signer
        const signer=await getProviderOrSigner(true);
        const address=await signer.getAddress();
        const balance=await nftContract.balanceof(address);

        //if nft=0, then token=0
        if(balance===zero){
          setTokensToBeClaimed(zero);
        }else{
          //loop through each nft the determine no. of tokens
          var amount = 0;
          //
          for (var i = 0; i < balance; i++) {
            const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
            const claimed = await tokenContract.tokenIdsClaimed(tokenId);
            if (!claimed) {
              amount++;
            }
          }
          setTokensToBeClaimed(BigNumber.from(amount));
        }

      }catch(err){
        console.log(err);
        setTokensToBeClaimed(zero);//if err ocurred 
      }
    }


//totalSupply fun helps to get TotalTokensMinted
    const getTotalTokensMinted=async()=>{
      try{
        const provider=await getProviderOrSigner();
        const tokenContract=new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider );
        const _tokensMinted=await tokenContract.totalSupply();
        setTokensMinted(_tokensMinted);
      }catch(err){
        console.log(err);
      }

    }


//
    const mintCryptoDevToken=async(amount)=>{
        try{
            //as we are minting, signer needed to sign tnx
            const signer=await getProviderOrSigner(true);
            //instance of contract
            const tokenContract=new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer );
            const value= 0.001*amount;

           //const tx=await tokenContract.mint(amount,{value:utils.parseEther(value.toString())})
            const tx = await tokenContract.claim();
            setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully claimed Crypto Dev Tokens");
            await getBalanceOfCryptoDevTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
            
        }catch(err){
            console.log(err);
        }
    }


//
    const claimCryptoDevTokens=async()=>{
      try {
        // We need a Signer here since this is a 'write' transaction.
        // Create an instance of tokenContract
        const signer = await getProviderOrSigner(true);
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS,TOKEN_CONTRACT_ABI,signer);
        const tx = await tokenContract.claim();
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("Sucessfully claimed Crypto Dev Tokens");
        await getBalanceOfCryptoDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
      } catch (err) {
        console.error(err);
      }

    }


//
    const renderButton = () => {
        // If we are currently waiting for something, return a loading button
        if (loading) {
          return (
            <div>
              <button className={styles.button}>Loading...</button>
            </div>
          );
        }
        // If tokens to be claimed are greater than 0, Return a claim button
        if (tokensToBeClaimed > 0) {
          return (
            <div>
              <div className={styles.description}>
                {tokensToBeClaimed * 10} Tokens can be claimed!
              </div>
              <button className={styles.button} onClick={claimCryptoDevTokens}>
                Claim Tokens
              </button>
            </div>
          );
        }
        // If user doesn't have any tokens to claim, show the mint button
        return (
          <div style={{ display: "flex-col" }}>
            <div>
              <input
                type="number"
                placeholder="Amount of Tokens"
                // BigNumber.from converts the `e.target.value` to a BigNumber
                //e.target.value = value that user entrred in input field
                onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                className={styles.input}
              />
            </div>
    
            <button
              className={styles.button}
              disabled={!(tokenAmount > 0)}
              onClick={() => mintCryptoDevToken(tokenAmount)}
            >
              Mint Tokens
            </button>
          </div>
        );
      };



    //useEffect gets called when user opens page // to connect wallet
    useEffect(() => {
        //if wallet not connected then connect with web3 modal
        // create reference of web3Modal to call fun on web3Modal
        if(!walletConnected){
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
              });
              connectWallet();
               getBalanceOfCryptoDevTokens();
               getTotalTokensMinted();
               getTokensToBeClaimed();
               getOwner();
        }

    }, [walletConnected])
    


  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="styles.main">
        <div>
          <h1 className="styles.title">Welcome to CryptoDevs ICO </h1>
          <div className="styles.description">
            You can claim or mint cryptodevs tokens here...
          </div>
          {/* conditional rendering { cnd ? ():() } */}
          {
            walletConnected ? (
                <div>
                    
                    <div className={styles.description}> 
                        You have minted {utils.formatEther(balanceOfCryptoDevTokens)} cryptoDev tokens
                    </div>

                    <div className={styles.description}>
                        Overall {utils.formatEther(tokensMinted)}/10,000 have been minted
                    </div>
                    {renderButton()}
                     </div>
            ) : (
                <button onClick={connectWallet} className={styles.button}>
                    Connect your wallet
                     </button>
            )
          }
          </div>
          <div>
            <img className={styles.image} src="./0.svg" />
          </div>
        </div>
  
        <footer className={styles.footer}>
          Made with &#10084; by Crypto Devs community -Nishant
        </footer>
      </div>
    );
  }

/* Pull in Channel contract */
const Channel = artifacts.require("./Channel.sol");
const Additional = artifacts.require("./Additional.sol");
const toBytes32 = require("../utils/toBytes32.js");



contract('Channel', function(accounts){

    let owner = accounts[0];
    let partner = accounts[1]; 
    let contract; // Will be instance of deployed Channel contract.
    let contractAddress; //Address of contract
    let additional; //Address of additional contract for testing
    let amount = 1000;
    let time = 86400;
    
    beforeEach(async function(){
        contract = await Channel.new(partner, time, {from: owner, value: amount, gas: 700000});
        contractAddress = await contract.address; 
        additional = await Additional.new({from:owner, gas:300000});

    })

    describe("Should allow contract creation", async function(){
        it("Should have an address", async function(){
            let checkAddress = await web3.isAddress(contractAddress);
            assert.isTrue(checkAddress, "No address saved, check tests.")
        })
        it("Should take in designated amount of Ether/Wei", async function(){
            let contractBalance = await web3.eth.getBalance(contractAddress); 
            assert.equal(contractBalance.toNumber(), amount, "Contract does not have correct balance.")
        })
    })

    describe("Interactions between owner & partner", async function(){
        it("Should allow owner to send a transaction to the partner", async function(){
            //Hash of contract address and value to send. 
            let result = await additional.hashData(contractAddress, 10);
            let getHash = result.logs[0]; 
            let hashData = getHash.args.ahash; 
            let signedData = web3.eth.sign(owner, hashData, {from: owner});
            let signedData2 = web3.eth.sign(partner, hashData, {from: partner});
            let r = toBytes32(signedData.slice(2, 66));
            let s = toBytes32(signedData.slice(66, 130));
            let v = signedData.slice(130, 132);
            if (v=='00') {
                v = 27;
            } else {
                v = 28; 
            }
            let r2 = toBytes32(signedData2.slice(2, 66));
            let s2 = toBytes32(signedData2.slice(66, 130));
            let v2 = signedData2.slice(130, 132);
            if (v2=='00') {
                v2 = 27;
            } else {
                v2 = 28; 
            }

            let result1 = await contract.CloseChannel(hashData, v, r, s, 10, {from: owner, gas:300000});
            let result2 = await contract.CloseChannel(hashData, v2, r2, s2, 10, {from: partner, gas:300000});
            /* Make sure to comment out self destruct function on contract, just testing appropriate amounts
            have been sent. */ 
            let newcontractbalance = await web3.eth.getBalance(contractAddress);
            console.log(newcontractbalance.toNumber());
    })
})
})
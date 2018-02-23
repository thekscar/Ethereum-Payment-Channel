/* Pull in Channel contract, Additional Contract & toBytes32 utils. */
const Channel = artifacts.require("./Channel.sol");
const Additional = artifacts.require("./Additional.sol");
const toBytes32 = require("../utils/toBytes32.js");


const timeTravel = function (time) {
        return new Promise((resolve, reject) => {
          web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time], // 86400 is num seconds in day
            id: new Date().getTime()
          }, (err, result) => {
            if(err){ return reject(err) }
            return resolve(result)
          });
        })
      }


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
        it("Should allow owner to send a transaction to the partner & close channel", async function(){
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

            let result1 = await contract.CloseChannel(hashData, v, r, s, 10, {from: partner, gas:300000});
            let result2 = await contract.CloseChannel(hashData, v2, r2, s2, 10, {from: partner, gas:300000});
            /* Make sure to comment out self destruct function on contract, just testing appropriate amounts
            have been sent. */ 
            let newcontractbalance = await web3.eth.getBalance(contractAddress);
            //Test that contract has the correct balance now after sending 10 wei to Alice. 
            assert.equal(newcontractbalance.toNumber(), 990, "Correct funds have not been sent.")
        })

        it("Should allow owner to send multiple transactions to partner & close channel", async function(){
            /* What happens when the owner send multiple transactions to the partner. */
            //First transaction, owner sends 10 wei to partner. 
            let result = await additional.hashData(contractAddress, 10);
            let getHash = result.logs[0]; 
            let hashData = getHash.args.ahash; 
            let signedData = web3.eth.sign(owner, hashData, {from: owner});
            let signedData2 = web3.eth.sign(partner, hashData, {from: partner});
            //Second transaction, owner sends additional 40 wei to partner for a total of 50 wei. 
            let result1 = await additional.hashData(contractAddress, 50);
            let getHash1 = result1.logs[0]; 
            let hashData1 = getHash1.args.ahash; 
            let signedData3 = web3.eth.sign(owner, hashData1, {from: owner});
            let signedData4 = web3.eth.sign(partner, hashData1, {from: partner});
            let r = toBytes32(signedData3.slice(2, 66));
            let s = toBytes32(signedData3.slice(66, 130));
            let v = signedData3.slice(130, 132);
            if (v=='00') {
                v = 27;
            } else {
                v = 28; 
            }
            let r2 = toBytes32(signedData4.slice(2, 66));
            let s2 = toBytes32(signedData4.slice(66, 130));
            let v2 = signedData4.slice(130, 132);
            if (v2=='00') {
                v2 = 27;
            } else {
                v2 = 28; 
            }

            let result3 = await contract.CloseChannel(hashData1, v, r, s, 50, {from: partner, gas:300000});
            let result4 = await contract.CloseChannel(hashData1, v2, r2, s2, 50, {from: partner, gas:300000});
            /* Make sure to comment out self destruct function on contract, just testing appropriate amounts
            have been sent. */ 
            let newcontractbalance = await web3.eth.getBalance(contractAddress);
            /* Test that contract has the correct balance now after sending 50 wei to Alice. 
            As long as the owner has sent a transaction to Alice, then Alice should be able to get 
            amount the proper amount in the time limit - sending her signed data and Bobs. */
            assert.equal(newcontractbalance.toNumber(), 950, "Correct funds have not been sent.")
        })
    })

    describe("Testing time limit functionality", async function(){
        it("Should allow owner to withdraw funds after channel times out", async function(){
            //Increase test chain after the time limit to withdrawl. 
            await timeTravel(200000);
            let result = await contract.ChannelTimeout(); 
            let thecode = await web3.eth.getCode(contractAddress);
            //Test that code no longer exists at the Channel contract address. 
            assert.equal(thecode, 0x0, "Contract has not been destructed.")
        })
    })
})
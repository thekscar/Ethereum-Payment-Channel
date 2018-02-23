var Channel = artifacts.require("./Channel.sol");

module.exports = function(deployer, accounts) {
    //Get the second account after the coinbase account
    const accountTwo = web3.eth.getAccounts((err,accounts) => account2 = accounts[1]);
    const timeOut = 86400;
    const amount = web3.toWei(10, "ether");
    deployer.deploy(Channel, accountTwo, timeOut, {value: amount});
};
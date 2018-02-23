pragma solidity ^0.4.18; 

contract Additional {
    event HashCreated(bytes32 ahash);

    function hashData(address to, uint value) 
        public
        returns(bytes32 thehash)
        {
            HashCreated(sha3(to, value));
            return sha3(to, value);
        }

}
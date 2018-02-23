pragma solidity ^0.4.18;

contract Channel {

	address public channelSender;
	address public channelRecipient;
	uint public startDate;
	uint public channelTimeout;
	mapping (bytes32 => address) signatures;

	function Channel(address to, uint timeout) payable {
		channelRecipient = to;
		channelSender = msg.sender;
		startDate = now;
		channelTimeout = timeout;
	}

	function CloseChannel(bytes32 h, uint8 v, bytes32 r, bytes32 s, uint value)
		public
		returns (bool success)
	{

		address signer;
		bytes32 proof;

		bytes memory prefix = "\x19Ethereum Signed Message:\n32";
		bytes32 prefixedHash = sha3(prefix, h);
		// get signer from signature
		signer = ecrecover(prefixedHash, v, r, s);

		// signature is invalid, throw
		
		if (signer != channelSender && signer != channelRecipient) throw;

		proof = sha3(this, value);

		// signature is valid but doesn't match the data provided
		if (proof != h) throw;

		if (signatures[proof] == 0)
			signatures[proof] = signer;
		else if (signatures[proof] != signer){
			// channel completed, both signatures provided
			if (!channelRecipient.send(value)) throw;
			//selfdestruct(channelSender);
		}

		return true; 

	}

	function ChannelTimeout(){
		if (startDate + channelTimeout > now)
			throw;

		selfdestruct(channelSender);
	}

}

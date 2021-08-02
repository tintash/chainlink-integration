// SPDX-License-Identifier: MIT
pragma solidity 0.4.24;

import 'https://github.com/smartcontractkit/chainlink/contracts/src/v0.4/ChainlinkClient.sol';
import 'https://github.com/smartcontractkit/chainlink/contracts/src/v0.4/vendor/Ownable.sol';

contract StacksRequestConsumer is ChainlinkClient, Ownable {
  uint256 private constant ORACLE_PAYMENT = 1 * LINK;

  event GetRequestFulfillmentEvent(bytes32 indexed requestId, string indexed response);

  constructor() public Ownable() {
    setPublicChainlinkToken();
  }

  function getRequest(
    address _oracle,
    string _jobId,
    string _requestUrl,
    string _responsePath
  ) public onlyOwner {
    Chainlink.Request memory req = buildChainlinkRequest(
      stringToBytes32(_jobId),
      this,
      this.getRequest.selector
    );
    req.add('get', _requestUrl);
    req.add('path', _responsePath);
    sendChainlinkRequestTo(_oracle, req, ORACLE_PAYMENT);
  }

  function fulfillGetRequest(bytes32 _requestId, string _response)
    public
    recordChainlinkFulfillment(_requestId)
  {
    emit GetRequestFulfillmentEvent(_requestId, _response);
  }

  function getChainlinkToken() public view returns (address) {
    return chainlinkTokenAddress();
  }

  function withdrawLink() public onlyOwner {
    LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
    require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
  }

  function cancelRequest(
    bytes32 _requestId,
    uint256 _payment,
    bytes4 _callbackFunctionId,
    uint256 _expiration
  ) public onlyOwner {
    cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
  }

  function stringToBytes32(string memory source) private pure returns (bytes32 result) {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
      return 0x0;
    }

    assembly {
      // solhint-disable-line no-inline-assembly
      result := mload(add(source, 32))
    }
  }
}

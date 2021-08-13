pragma solidity 0.4.24;

import 'https://github.com/smartcontractkit/chainlink/contracts/src/v0.4/ChainlinkClient.sol';
import 'https://github.com/smartcontractkit/chainlink/contracts/src/v0.4/vendor/Ownable.sol';

contract StacksRequestConsumer is ChainlinkClient, Ownable {
  uint256 private constant ORACLE_PAYMENT = 1 * LINK;

  event GetRequestFulfilled(bytes32 indexed requestId, bytes32 indexed response);
  event PostRequestFulfilled(bytes32 indexed requestId, bytes32 indexed response);

  constructor() public Ownable() {
    setPublicChainlinkToken();
  }

  function getRequest(
    address _oracle,
    string _jobId,
    string memory _requestUrl,
    string memory _responsePath
  ) public onlyOwner {
    Chainlink.Request memory req = buildChainlinkRequest(
      stringToBytes32(_jobId),
      this,
      this.fulfillGetRequest.selector
    );
    req.add('get', _requestUrl);
    req.add('path', _responsePath);
    sendChainlinkRequestTo(_oracle, req, ORACLE_PAYMENT);
  }
  
  function postRequest(
    address _oracle,
    string _jobId,
    string memory _requestUrl,
    string memory _responsePath,
    string memory _data
  ) public onlyOwner {
    Chainlink.Request memory req = buildChainlinkRequest(
      stringToBytes32(_jobId),
      this,
      this.fulfillPostRequest.selector
    );
    req.add('post', _requestUrl);
    req.add('path', _responsePath);
    req.add('body',_data );
    sendChainlinkRequestTo(_oracle, req, ORACLE_PAYMENT);
  }

  function fulfillGetRequest(bytes32 _requestId, bytes32 _response)
    public
    recordChainlinkFulfillment(_requestId)
  {
    emit GetRequestFulfilled(_requestId, _response);
  }
  
  function fulfillPostRequest(bytes32 _requestId, bytes32 _response)
    public
    recordChainlinkFulfillment(_requestId)
  {
    emit PostRequestFulfilled(_requestId, _response);
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
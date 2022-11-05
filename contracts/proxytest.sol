//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract SealUpgradeable is  ERC721AUpgradeable, OwnableUpgradeable {

    using StringsUpgradeable for uint256;

    string public baseUri ;
    string public uriSuffix ;
    bool private _revealed;
    bool public enableMint ;
    uint256 public max_supply;
    event SetBaseURI(address _from);

    function initialize() initializerERC721A initializer public {
        __ERC721A_init('Seal', 'SEAL');
        __Ownable_init();
        baseUri = "ipfs://QmZVosLJoEmpf9U9q7yzCBz48EBgMHJBJouWce1W3uMPhr/7.json";
        uriSuffix = ".json";
        max_supply = 11;
        enableMint = false;
        _revealed = false;
    }

    function mint(uint256 quantity) external payable {
        require(totalSupply()+quantity<=max_supply,"Out of max supply");
        require(enableMint, "Cannot mint");
        _mint(msg.sender, quantity);
    }

    // override
    function _baseURI() override internal view virtual returns (string memory) {
        return baseUri;
    }

    // override start token id from 0 to 0
    function _startTokenId() override internal view virtual returns (uint256) {
        return 0;
    }

    function airdrop(uint256 quantity, address _receiver) public onlyOwner {
        _safeMint(_receiver, quantity);
    }

    function setMint(bool value) public onlyOwner {
        enableMint = value;
    }

    function setBaseUri(string memory uri) public onlyOwner {
        baseUri = uri;
        emit SetBaseURI(msg.sender);
    }

    function setUriSuffix(string memory _uriSuffix) public onlyOwner {
        uriSuffix = _uriSuffix;
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "URI query for nonexistent token");
        if (!_revealed) return baseUri;
        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
            ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
            : "";
    }


    function reveal(string memory uri) external onlyOwner {
        if(_revealed) {
            _revealed=false;
        }else{
            _revealed = true;
            }
        
        baseUri = uri;
        emit SetBaseURI(msg.sender);
    }
}
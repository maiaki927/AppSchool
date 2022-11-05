// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AppWorks_week9 is ERC721, Ownable {
    using Strings for uint256;

    using Counters for Counters.Counter;
    Counters.Counter private _nextTokenId;

    uint256 public price = 0.01 ether;
    uint256 public constant maxSupply = 100;

    bool public mintActive = false;
    bool public earlyMintActive = false;
    bool public revealed = false;

    string public baseURI;
    bytes32 public merkleRoot;

    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256) public addressMintedBalance;

    constructor() ERC721("AppWorks", "AW") {}

    // Public mint function - week 8
    // Set mint per user limit to 10 and owner limit to 20 - Week 8
    //Please make sure you check the following things:
    //Current state is available for Public Mint
    //Check how many NFTs are available to be minted
    //Check user has sufficient funds
    function mint(uint256 _mintAmount) public payable {
        require(mintActive, "mintActive is false");
        require(_mintAmount > 0, "Amount need > 0");
        require(msg.value == price * _mintAmount, "Error price");
        require(_mintAmount + totalSupply() <= maxSupply, "Out of maxSupply");
        if (msg.sender == owner()) {
            require(
                addressMintedBalance[msg.sender] + _mintAmount <= 20,
                "Owner limit to 20"
            );
        } else {
            require(
                addressMintedBalance[msg.sender] + _mintAmount <= 10,
                "Per user limit to 10"
            );
        }
        addressMintedBalance[msg.sender] += _mintAmount;
        for (uint256 i = 0; i < _mintAmount; i++) {
            _safeMint(msg.sender, _nextTokenId.current());
            _nextTokenId.increment();
        }
    }

    // Implement totalSupply() Function to return current total NFT being minted - week 8
    function totalSupply() public view returns (uint256) {
        return _nextTokenId.current();
    }

    // Implement withdrawBalance() Function to withdraw funds from the contract - week 8
    function withdrawBalance() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Implement setPrice(price) Function to set the mint price - week 8
    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    // Implement toggleMint() Function to toggle the public mint available or not - week 8
    function toggleMint() public onlyOwner {
        mintActive = !mintActive;
    }

    // Implement toggleReveal() Function to toggle the blind box is revealed - week 9
    function toggleReveal() public onlyOwner {
        revealed = !revealed;
    }

    // Implement setBaseURI(newBaseURI) Function to set BaseURI - week 9
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    // Function to return the base URI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // Early mint function for people on the whitelist - week 9
    function earlyMint(bytes32[] calldata _merkleProof, uint256 _mintAmount)
        public
        payable
    {
        //Please make sure you check the following things:
        //Current state is available for Early Mint
        //Check how many NFTs are available to be minted
        //Check user is in the whitelist - use merkle tree to validate
        //Check user has sufficient funds

        //todo _merkleProof 2022.09.27
        require(earlyMintActive, "earlyMintActive is false");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verifyCalldata(_merkleProof, merkleRoot, leaf),
            "You're not in the whitelist"
        );
        require(_mintAmount > 0, "Amount need > 0");
        require(msg.value == price * _mintAmount, "Error price");
        require(_mintAmount + totalSupply() <= maxSupply, "Out of maxSupply");
        if (msg.sender == owner()) {
            require(
                addressMintedBalance[msg.sender] + _mintAmount <= 20,
                "Owner limit to 20"
            );
        } else {
            require(
                addressMintedBalance[msg.sender] + _mintAmount <= 10,
                "Per user limit to 10"
            );
        }
        addressMintedBalance[msg.sender] += _mintAmount;
        for (uint256 i = 0; i < _mintAmount; i++) {
            _safeMint(msg.sender, _nextTokenId.current());
            _nextTokenId.increment();
        }
    }

    // Implement toggleEarlyMint() Function to toggle the early mint available or not - week 9
    function toggleEarlyMint() public onlyOwner {
        earlyMintActive = !earlyMintActive;
    }

    // Implement setMerkleRoot(merkleRoot) Function to set new merkle root - week 9
    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        if (!revealed) return _baseURI();
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }
    // Let this contract can be upgradable, using openzepplin proxy library - week 10
    // Try to modify blind box images by using proxy
}
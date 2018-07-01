pragma solidity ^0.4.18;
// We have to specify what version of compiler this code will compile with

/*
 Dan,        Caroline,             Caleb
["0x44616e", "0x4361726f6c696e65", "0x43616c6562"]

1      2      3
"0x31" "0x32" "0x33"

Booth 1
"0x14723a09acff6d2a60dcdf7aa4aff308fddc160c", "0x31"

Booth 2
"0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db", "0x32"

Vote id1 Dan
"0x31", "0x34", "0x44616e"
"0x32", "0x35", "0x4361726f6c696e65"
"0x33", "0x36", "0x43616c6562"
*/
contract Election {

    // INIT METHOD

    address public organiser;

    function Election(bytes32[] candidateNames) public {
        organiser = msg.sender;
        candidateList = candidateNames;
    }




    // CANDIDATES

    bytes32[] public candidateList;
    mapping (bytes32 => uint32) public candidateVotes;

    function isValidCandidate(bytes32 check) view public returns (bool) {
        for(uint i = 0; i < candidateList.length; i++) {
            if (candidateList[i] == check) {
                return true;
            }
        }
        return false;
    }

    function getTotalVotesFor(bytes32 candidate) view public returns (uint32) {
        require(isValidCandidate(candidate));
        return candidateVotes[candidate];
    }


    // POLLING BOOTHS

    struct PollingBooth {
        bytes32 name;
    }
    mapping(address => PollingBooth) public pollingBooths;
    address[] public pollingBoothAccounts;

    function createPollingBooth(address _address, bytes32 _name) public {
        require(msg.sender == organiser);
        require(!isExistingPollingBooth(_address));
        require(isValidPollingBoothName(_name));
        var pollingBooth = pollingBooths[_address];
        pollingBooth.name = _name;
        pollingBoothAccounts.push(_address) -1;
    }
    function isExistingPollingBooth(address _address) public view returns(bool isIndeed) {
        for(uint i = 0; i < pollingBoothAccounts.length; i++) {
            if (pollingBoothAccounts[i] == _address) {
                return true;
            }
        }
        return false;
    }
    //TODO - Put polling booth validation into same method
    function isValidPollingBoothName(bytes32 _name) public view returns(bool isIndeed) {
        for(uint i = 0; i < pollingBoothAccounts.length; i++) {
            if (pollingBooths[pollingBoothAccounts[i]].name == _name) {
                return false;
            }

        }
        return true;
    }
    function getPollingBooths() view public returns(address[]) {
        return pollingBoothAccounts;
    }
    function getPollingBooth(address _address) view public returns (bytes32) {
        return (pollingBooths[_address].name);
    }
    function countPollingBooths() view public returns (uint) {
        return pollingBoothAccounts.length;
    }


    // VOTING

    struct Voter {
        bytes32 id;
        bytes32 name;
        bool voted;
        bytes32 candidate;
        address pollingBooth;
        uint32 voteTime;
    }

    bytes32[] public voterList;
    mapping(bytes32 => Voter) voters;

    function vote(bytes32 _voterId, bytes32 _voterName, bytes32 _candidate, uint32 _voteTime) public {
        require(isExistingPollingBooth(msg.sender));
        require(isValidCandidate(_candidate));
        require(isValidVoter(_voterId));

        var voter = voters[_voterId];
        voter.id = _voterId;
        voter.name = _voterName;
        voter.voted = true;
        voter.candidate = _candidate;
        voter.pollingBooth = msg.sender;
        voter.voteTime = _voteTime;

        voterList.push(_voterId) -1;
        candidateVotes[_candidate] += 1;
    }
    function isValidVoter(bytes32 _voterId) public view returns(bool isIndeed) {
        if(voters[_voterId].voted) {
            return false;
        }
        for(uint i = 0; i < voterList.length; i++) {
            if (voterList[i] == _voterId) {
                return false;
            }
        }
        return true;
    }

    function getVoters() view public returns(bytes32[]) {
        return voterList;
    }
    function getVoter(bytes32 _voterId) view public returns (bytes32, bytes32, bool, bytes32, address, uint32) {
        return (voters[_voterId].id, voters[_voterId].name, voters[_voterId].voted, voters[_voterId].candidate, voters[_voterId].pollingBooth, voters[_voterId].voteTime);
    }
    function countVotes() view public returns (uint) {
        return voterList.length;
    }

}

let Web3 = require('web3')
let solc = require('solc')
let fs = require('fs')
let moment = require('moment')

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

const CONFIG_FILE = 'blockchain/generated-config.json'
const CONTRACT_FILE = 'blockchain/Election.sol'
const POLLING_BOOTH_NAME = 'ABC_123'

let ABI
let ADDRESS
let CONTRACT
let CANDIDATES
let POLLING_BOOTHS = {}

// exports.ensureAccountExists = function (id) {
//   // TODO - check if account already exists
//   return createAccount(id)
// }

// function createAccount (id) {
//   let accountId = web3.personal.newAccount(id)
//   let balance = web3.eth.getBalance(accountId)
//   web3.personal.unlockAccount(accountId, id, 15000)
//   console.log('accountDetails', accountId, balance)
//   return accountId
// }
exports.ensureContractIsDeployedAndPollingBoothIsAdded = async function (candidates) {
  let config
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
  }
  CANDIDATES = candidates
  console.log('config raw', config)
  if (config == null || config.abi == null || config.address == null) {
    config = await generateAndDeployContract(getOrganiserAccount())
  } else {
    ABI = config.abi
    ADDRESS = config.address
    CONTRACT = web3.eth.contract(ABI).at(ADDRESS)
  }
  ensurePollingBoothIsRegistered()
  getVotingStats()
  return config
}
function getCandidateNames () {
  let candidateNames = []
  CANDIDATES.forEach(function (candidate) {
    candidateNames.push(candidate.name)
  })
  return candidateNames
}
function generateAndDeployContract (user) {
  return new Promise(resolve => {
    let code = fs.readFileSync(CONTRACT_FILE).toString()
    let compiledCode = solc.compile(code)
    let abiDefinition = JSON.parse(compiledCode.contracts[':Election'].interface)
    let ElectionContract = web3.eth.contract(abiDefinition)
    console.log('ElectionContract: ', ElectionContract)
    let byteCode = compiledCode.contracts[':Election'].bytecode
    console.log('byteCode: ', byteCode)
    ElectionContract.new(getCandidateNames(), {data: byteCode, from: user, gas: 4700000}, function (err, deployedContract) {
      if (!err && deployedContract.address) {
        console.log('Address: ', deployedContract.address)
        ABI = abiDefinition
        ADDRESS = deployedContract.address
        CONTRACT = ElectionContract.at(deployedContract.address)
        let config = {
          abi: ABI,
          address: ADDRESS
        }
        saveConfig(config)
        config.contract = CONTRACT
        resolve(config)
      }
    })
  })
}
async function ensurePollingBoothIsRegistered (config) {
  let pollingBoothAccount = getPollingBoothAccount()
  let pollingBoothRegistered = CONTRACT.isExistingPollingBooth.call(pollingBoothAccount)
  console.log('pollingBoothRegistered', pollingBoothRegistered)
  if (!pollingBoothRegistered) {
    registerPollingBooth(config, pollingBoothAccount, getOrganiserAccount())
  }
  // return pollingBoothInstance
}
async function registerPollingBooth (config, pollingBoothAccount, organiserAccount) {
  let registerResult = await CONTRACT.createPollingBooth.sendTransaction(pollingBoothAccount, POLLING_BOOTH_NAME, {from: organiserAccount, gas: 4700000})
  console.log('registerResult', registerResult)

  let pollingBoothRegistered = CONTRACT.isExistingPollingBooth.call(pollingBoothAccount)
  console.log('pollingBoothRegistered 2', pollingBoothRegistered)
}
function getOrganiserAccount () {
  return web3.eth.accounts[0]
}
function getPollingBoothAccount () {
  return web3.eth.accounts[1]
}

function saveConfig (config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4))
}

function getVotingStats () {
  CANDIDATES.forEach(function (candidate) {
    var voteCount = CONTRACT.getTotalVotesFor.call(candidate.name).toLocaleString()
    console.log('Votes for ' + candidate.name + ': ' + voteCount)
  })
}

exports.vote = async function (voterId, voterName, candidate) {
  console.log('Vote:', voterId, voterName, candidate)
  try {
    var voteResult = await CONTRACT.vote.sendTransaction(web3.fromAscii(voterId, 32), web3.fromAscii(voterName), web3.fromAscii(candidate), new Date().getTime() / 1000, {from: getPollingBoothAccount(), gas: 4700000})
    console.log('Vote from: ' + voterName + ' (' + voterId + '). For: ' + candidate + '. Result: ' + voteResult)
    getVotingStats()
    return true
  } catch (error) {
    console.log('Vote rejected: ', voterId, voterName, candidate)
    return false
  }
}

async function getPollingBoothName (address) {
  if (!(address in POLLING_BOOTHS)) {
    let name = await getPollingBoothData(address)
    console.log('name: ', name)
    POLLING_BOOTHS[address] = name
  }
  return POLLING_BOOTHS[address]
}

async function getPollingBoothData (address) {
  var name = web3.toAscii(await CONTRACT.getPollingBooth.call(address))
  console.log('Polling Booth Data: Address: ' + address + '. Name: ' + name)
  return name
}

exports.getVoter = async function (voterId) {
  console.log('_voterId', voterId, web3.fromAscii(voterId))
  var voterArray = await CONTRACT.getVoter.call(web3.fromAscii(voterId))
  var voter = {
    id: web3.toAscii(voterArray[0]),
    name: web3.toAscii(voterArray[1]),
    voted: voterArray[2],
    candidate: web3.toAscii(voterArray[3]),
    pollingBooth: await getPollingBoothName(voterArray[4]),
    voteTime: moment(voterArray[5].toNumber() * 1000).format('HH:mm:ss DD-MM-YYYY')
  }
  console.log('voter', voterArray, voter)
  return voter
}

web3.toAsciiOriginal = web3.toAscii
web3.toAscii = function (input) { return web3.toAsciiOriginal(input).replace(/\u0000/g, '') }

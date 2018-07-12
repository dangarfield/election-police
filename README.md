# Election Police - Tamperproof Balloting
> Create the next generation in confidence of polling results by using highly secure and immutable data sources

![Election Police](https://image.ibb.co/mfpC9y/Screen_Shot_2018_07_01_at_17_46_03.png)

### Key Points and initial thoughts
- Need to ensure the is ZERO risk of accusation and opportunity for tampering the data, the two main points of risk are at the user authentication and the vote syndication points
- Use an external trusted partner for user authentication. I've added facebook, however, we should really use the TUI AD for the hackathon. A nice additional element would be to look at biometric authentication, we could use image recognition. Potentially scrape user profiles from TUI Smile / create a registration mechanism that creates, uploads and indexes images. For simplicity and time, we should use a known existing service such as AWS Rekognition
- For vote data syndication, use blockchain, with this, it makes sense to ensure there is no accusation of risk of tampering, therefore, using a public highly distributed blockchain makes sense. Ethereum is a good example
- As we will be storing private and confidential data within a blockchain we need to do a lot of encrypting - Something like [eth-crypto](https://github.com/pubkey/eth-crypto)
- We can try testing this locally using a in memory blockchain such as [ganache](https://github.com/trufflesuite/ganache), however, I believe that we should be using a public blockchain to minimise the level of tampering accusation
- We should also demo / have graphics explaining both the reason why a public blockchain is more tamperresistant and how transactions added to the blockchain are validated
- Make it look good, simple pages, animation, video, transitions and contemporary styling

TUI Maker Fair Project 2018 from Dan Garfield


### Initial Design Designs (All reversible, based on initial research and testing)
- Small node.js app - Easy and cheap to deploy, easy to write (if you understand async), plenty of libraries, low resource requirements
- Base node.js libraries - Express (web framework), Passport (user authentication framework with built in existing connectors for facebook etc)
- Authentication - Anything trusted, we should add TUI AD, I just plugged into facebook to get something started. Would also like to demonstrate biometric authentication, without making it overly complicated or the registration process overly heavy. If we use multiple auths, do we need to worry about deduping, for this hackathon, no.
- Ethereum - Blockchain app that works well with smart contracts and already has a rich ecosystem. It is tried and tested, scalable and has enough public nodes to be typically immune to cooersive manipulation attempts
- Blockchain compiler / DApp framework - Could use truffle, I wanted to learn from scratch, so went straight to writing contracts in solidity, used solc (Node solidity compiler) and web3 (JavaScript API to Ethereum through RPC)
- Local blockchain testing - Ganache CLI for local blockchain. I haven't used the Ganache UI yet, but I've been using the [Remix](https://remix.ethereum.org/) portal for optimising the smart contracts, which seems to be working well
- UI - Bootstrap, no fuss. I wanted it to be a very strong and contemporary design, animations and transitions ([anime.js](http://animejs.com/), [animate.css](https://daneden.github.io/animate.css/) etc) with subtle video backgrounds and full page app feel. Also wanted to animate the logo ([example](https://codepen.io/anon/pen/PaVRod)).
- Accounts, Nodes and Ether - After a little playing, I was initially imagining creating an ethererum account for each voter, I've since decided (for a number of reason that I can explain) that it is logistically better and therefore more feasible in the time frames to use accounts for each polling booth. Also, creating a master 'organiser' account for the contract creation, closure and admin. I would suggest there would be two contracts. One for the vote proper, one for the authentication of polling booths but we can add them to the same contract for the time being. The organiser would be responsible for creating the contract, and adding polling booths. Only polling booths previously accepted would be able to vote.
- Admin and results - Need to ensure that there is an effective portal for looking at admin tasks. This includes setuping up the polling booths, contract results and other meta-data. This would be in a dashboard format
- Opening and closing - Need to deal with opening and closing the election as an admin task. Whilst the election is running, the transactions will be public, therefore we need to insure the is no way to look at the voter and voted candidate data from these transactions. After the end of the election, there should be a locking mechanism and also a way to publically total the results without giving up any voter details
- Contract - Standard soldity contract, nothing spectacular here if you look at the file
- Pages - Home (call to action to authenticate), facebook auth (hosted facebook login), TUI AD Auth (hosted TUI login), Facial recognition registration (from of a admin portal / portable so it can be easy and quick to do on a phone etc), Facial recognition login, voting page (simple blurb data and choice, if you've voted before, it tells you when and where). Admin page - Contract creation and closure, polling booth account admin, ether topup for accounts, polling results,
- Data - Look in solidity contract
- Browser data transfer - I didn't feel comfortable putting the address and ABI of the contract in the browser, nor the logic and eventual encryption methods, so I have sent it to the server at this point. If someone convinces me otherwise, it can be directly from the browser,
- Encryption - Haven't investigated so far, but would look at eth-crypto. Create keys for nodes, ensure differe keys / ciphers for the voter and candidate data to be encrypted. I imagine we would simply release one of those keys publically after the election to show that people can authenticate the results


### Technology Usage and Installation
Installation and Usage
- Install `ethereum` locally [Instructions}(https://www.ethereum.org/cli). This includes Geth, a Go implementation of ethereum
- Install `node.js` and `npm`
- Install `git` and clone this repo
- Install dependencies through `npm install`
- For facebook login, you need to set the some environment variables (in the `.env` file). You can either create a facebook app yourself and set the App Id and secret in the files, or ask Dan.
- Start ethereum (local ganache) in one terminal `npm run ganache`. This will also remove your generated-contract.json file (uses rm -f, needs to be changed on native windows if not using docker etc). Change for windows for ganache cli, or just install ganache gui and set the port to 8545
- In a new terminal, run app with `npm start`. This will compile and generate and deploy the contract (if the generated-config.json is missing). It also creates a polling node and authenticates it against the contract on startup. This should be a set as separate task within a distributed app environment, but initial local testing is ok
- Candidate data from `candidates.json` will be used in the contract and UI
- View app in `http://localhost:5200`
- You can also debug the contract a browser if you find that easier `https://remix.ethereum.org`, copy and paste the contract in the online IDE, and connect by adding the address of the deployed contract to your local ganache instance. Everything is available to debug easily here although I'm sure there are better ways
- Note: Time did not allow a quick way of soling the passport-facebook logout issue as I would have to implement the JS SDK in the browser, which is a pain. Instead, I opted for using firefox and a couple of addons - Linkognito, opens links with a class of 'linkognito' in an incognito tab - TabAutoClose, closes a tab with a certain regex title. This simply enabled me to ensure every login was in a separate session as if from a different computer
- Voting results at `http://localhost:5200/results`


### TODO
- Encryption and decryption of message content as above
- Account creation, rights and balances. Includes web portal. Using ganache, assumed organiser and polling booth 1 accounts are web3.eth.accounts[0] and web3.eth.accounts[1] respectively. This needs to be different if using the testnet or mainnet blockchains. Code needs to be refined for this to be effective locally and as a distributed app
- Add more methods from the `Election.sol` contract to  `blockchain/contract.js`. May need to create more methods in contract
- Maybe be a little more efficient to object and types in the contract. I've read mixed things, but this is just a POC
- Productionised deployments of node app (Use Zeit Now, it is much simpler) including .env
- All UI as mentioned - This is important
- Deploy to ethereum testnet. I think we probably dont need to go to mainnet for this POC. More hassle than its worth in terms of requiring ether etc. This includes parameterising hardcoded urls etc
- Ability to launch and close a voting session
- Admin portal for vote results and syndication of public keys
- Web based configuration of candidates.json
- Prove transactions cannot be faked or hacked. Demo portal displaying this use case (potentially use web3 in the browser for this)
- Passport logout does not logout user from facebook. We need to call facebook logout api using the obtained access token
- Create and integrate with TUI AD
- Create facial recognition registration page (Use AWS Rekognition, indexFaces and detectFaces [example](https://aws.amazon.com/blogs/machine-learning/build-your-own-face-recognition-service-using-amazon-rekognition/)
- Create face login page
- Ensure login IDs do not clash (eg, _voterId in the contract)


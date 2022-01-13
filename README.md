# Minter

### Install

```shell
npm i
cp secrets.sample.json secrets.json
```

### Dev

```shell
npx hardhat compile
npx hardhat test
```

### Deploy

```shell
# clean build
npx hardhat clean
npx hardhat compile

# deploy
npx hardhat run --network kovan scripts/deploy.js

# verify
npx hardhat verify --network kovan DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"

# upgrade
npx hardhat run --network kovan scripts/test/upgrade.js
```

### Mainnet

-   ProxyAdmin
-   Proxy

### Kovan

-   ProxyAdmin
-   Proxy

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

# lint
npm run lint

# solhint
npm run solhint

# deploy
npx hardhat run --network kovan scripts/deploy.js

# verify
IMP=0xA8a839CcFAA8671D36ECb25Fc5600c1eA5859Beb
USDV=0xF5783253A21E5E740908CEdB800183b70A004479

npx hardhat verify --network kovan $IMP $USDV

# flatten
npx hardhat flatten contracts/VaderMinterUpgradeable.sol > tmp/flat.sol
```

### Mainnet

-   ProxyAdmin
-   Proxy

### Kovan

-   ProxyAdmin 0xb16fE6d250d8d9188ef3599cC653C58087DAAAA7
-   Proxy 0x60933C457Bbca83FD2eA8018A4D2d6662B024B20

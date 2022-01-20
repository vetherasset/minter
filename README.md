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

-   ProxyAdmin 0xed7D9E050121d386CCe2e8D9F239f0259482B242
-   Proxy 0xBeF6975EdB6485965e49eaad5505aFD6b11b5958

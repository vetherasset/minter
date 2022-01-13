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
IMP=0x5627F11c780c291F3e5739f76777B898570e2326
USDV=0x0de905dfb036521f5A45Da90B2D9e8a74a9CE42E

npx hardhat verify --network kovan $IMP "$USDV"

# flatten
npx hardhat flatten contracts/VaderMinterUpgradeable.sol > tmp/flat.sol
```

### Mainnet

-   ProxyAdmin
-   Proxy

### Kovan

-   ProxyAdmin 0x3ddBc954EF60b31f1299F462e72d9B4bF5A4328f
-   Proxy 0x17c7309d59514A18Fa623fb0371256a976E5DCE7

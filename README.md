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
IMP=0xc43ee544522161dce3de9f6d62225221019d28c8
USDV=0x0de905dfb036521f5A45Da90B2D9e8a74a9CE42E

npx hardhat verify --network kovan $IMP "$USDV"

# flatten
npx hardhat flatten contracts/VaderMinterUpgradeable.sol > tmp/flat.sol
```

### Mainnet

-   ProxyAdmin
-   Proxy

### Kovan

-   ProxyAdmin 0x20e9e0F4249bc965aCf15FF99DC64F73f31fe610
-   Proxy 0x02Db56B61614507f07ae0E75981D7D45B0da0ac9

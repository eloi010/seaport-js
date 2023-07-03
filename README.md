# Seaport.js Demo With Openfort Accounts

Seaport is a new marketplace protocol from Opensea for safely and efficiently buying and selling NFTs.
This sample is exemplifying how to integrate Openfort contracts with the Seaport JavaScript library.
Specifically, it shows how to create orders and fulfilling them using Openfort accounts.

## Demo

[Live demo video](https://ToDo)

## Features

- ⛵️ Seaport.JS from Opensea
- 🏰 Openfort accounts

## How to run locally

**1. Clone the sample repository**

```console
git clone --recurse-submodules git@github.com:openfort-xyz/samples.git
cd seaport-js
```

**2. Install all dependencies**

```console
npm i
```

**3. Run the Openfort test**

The current sample is using a local hardhat network to deploy and interact with Seaport and Openfort contracts.
The test starts creates a testing NFT (testErc721) and a testing ERC20s (testErc20).
Then, it uses an Openfort account to publish an offer to purchase a given testErc721 for 10 testErc20s.
In order to publish such offer, it needs to be signed by the owner of the openfort account (`orderSigner` in the test).
Finally, the owner of the NFT fulfills the offer.

```console
npx hardhat test test/create-order-openfort.ts
```

## Get support

If you found a bug or want to suggest a new [feature/use case/sample], please [file an issue](../../../issues).

If you have questions, comments, or need help with code, we're here to help:

- on [Discord](https://discord.com/invite/t7x7hwkJF4)
- on Twitter at [@openfortxyz](https://twitter.com/openfortxyz)
- by [email](mailto:support+github@openfort.xyz)

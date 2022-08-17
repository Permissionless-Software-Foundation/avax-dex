# avax-dex

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

This is a prototype web service that monitors the [P2WDB](https://github.com/Permissionless-Software-Foundation/ipfs-p2wdb-service) for trading signals, to trade AVAX and Avalanche Native Tokens (ANTs) on the AVAX X-Chain. It's inspired by the [SWaP Protocol](https://github.com/vinarmani/swap-protocol/blob/master/swap-protocol-spec.md).

To see more technical details, check out the [Developer Documentation](./dev-docs)

## Installation

It's assumed this software is being run on an AMD64 processor running Ubuntu OS, with Docker, Docker Compose, and node.js installed. Notes for installing this software can be found [here](https://christroutner.github.io/trouts-blog/docs/dev-ops/overview).

- `git clone https://github.com/Permissionless-Software-Foundation/avax-dex`
- `cd avax-dex`
- `npm install`
- `cd production/scripts`
- `node create-wallets.js`
- `cd ../docker/`
- `docker-compose pull`
- `docker-compose build`
- `docker-compose up -d`

## Usage


## License

[MIT](./LICENSE.md)

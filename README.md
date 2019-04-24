memo-push
=========

A simple command-line tool to publish IPFS hashes to the BCH blockchain using
the memo.cash protocol.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/memo-push.svg)](https://npmjs.org/package/memo-push)
[![Downloads/week](https://img.shields.io/npm/dw/memo-push.svg)](https://npmjs.org/package/memo-push)
[![License](https://img.shields.io/npm/l/memo-push.svg)](https://github.com/christroutner/memo-push/blob/master/package.json) [![Greenkeeper badge](https://badges.greenkeeper.io/christroutner/memo-push.svg)](https://greenkeeper.io/)

<!-- toc -->
# Installation
- Install the npm package globally, in order to use it as a command line tool:

`sudo npm install -g memo-push`

- Create an account on [memo.cash](https://memo.cash) and add the private key
(in WIF compressed format) to your environment variables:

`export WIF=L4b9LdXgVUHYXWmSV1VFXhUzZjXhtHg6mHcx4j8XfYG9K6fReMid`

*Note*: Any BCH address WIF can be used, but if WIF matches a memo.cash account,
people will easily be able to see your updates by following your memo.cash profile.

# Usage
<!-- usage -->
- `memo-push -h` - display help menu
- `memo-push -v` - display version
- `memo-push -p <hash>` - Publish an IPFS hash to the BCH blockchain.

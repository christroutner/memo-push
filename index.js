/*
  Publish IPFS hashes to the BCH blockchain using the memo.cash protocol
*/

"use strict";

const BITBOXSDK = require("bitbox-sdk");
const BITBOX = new BITBOXSDK();

// Used for debugging and iterrogating JS objects.
const util = require("util");
util.inspect.defaultOptions = { depth: 1 };

async function memoPush() {
  try {
    console.log(`Hello world!`);
  } catch (err) {
    console.error(err);
  }
}
memoPush();

//module.exports = memoPush

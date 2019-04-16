/*
  Publish IPFS hashes to the BCH blockchain using the memo.cash protocol
*/

"use strict";

const BITBOXSDK = require("bitbox-sdk");
const BITBOX = new BITBOXSDK();

// Used for debugging and iterrogating JS objects.
const util = require("util");
util.inspect.defaultOptions = { depth: 1 };

const WIF = process.env.WIF;

if (!WIF || WIF === "") {
  console.log(`Please add your WIF key to the WIF environment variable.`);
  return;
}

async function memoPush(argv) {
  try {
    console.log(`argv: ${util.inspect(argv)}`)

    // Create an EC Key Pair from the user-supplied WIF.
    const ecPair = BITBOX.ECPair.fromWIF(SEND_WIF)

    // Generate the public address that corresponds to this WIF.
    const ADDR = BITBOX.ECPair.toCashAddress(ecPair)
    console.log(`Sending a memo.cash message for ${ADDR}`);

    // Pick a UTXO controlled by this address.
    const u = await BITBOX.Address.utxo(ADDR);
    const utxo = findBiggestUtxo(u.utxos);

    // instance of transaction builder
    const transactionBuilder = new BITBOX.TransactionBuilder();

    //const satoshisToSend = SATOSHIS_TO_SEND
    const originalAmount = utxo.satoshis;
    const vout = utxo.vout;
    const txid = utxo.txid;

    // add input with txid and index of vout
    transactionBuilder.addInput(txid, vout);

    // TODO: Compute the 1 sat/byte fee.
    const fee = 500;

    // Send the same amount - fee.
    transactionBuilder.addOutput(ADDR, originalAmount - fee);

    // Add the memo.cash OP_RETURN to the transaction.
    const script = [
      BITBOX.Script.opcodes.OP_RETURN,
      Buffer.from("6d02", "hex"),
      Buffer.from("Hello BITBOX 03")
    ];

    //console.log(`script: ${util.inspect(script)}`);
    const data = BITBOX.Script.encode(script);
    //console.log(`data: ${util.inspect(data)}`);
    transactionBuilder.addOutput(data, 0);

    // Generate a change address from a Mnemonic of a private key.
    //const change = changeAddrFromMnemonic(MNEMONIC)

    // Generate a keypair from the change address.
    const keyPair = BITBOX.HDNode.toKeyPair(change);

    // Sign the transaction with the HD node.
    let redeemScript;
    transactionBuilder.sign(
      0,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      originalAmount
    );

    // build tx
    const tx = transactionBuilder.build();
    // output rawhex
    const hex = tx.toHex();
    //console.log(`TX hex: ${hex}`);
    //console.log(` `);

    // Broadcast transation to the network
    const txidStr = await BITBOX.RawTransactions.sendRawTransaction(hex)
    console.log(`Transaction ID: ${txidStr}`)
    console.log(`Check the status of your transaction on this block explorer:`)
    console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)


  } catch (err) {
    console.error(err);
  }
}
//memoPush();

// Returns the utxo with the biggest balance from an array of utxos.
function findBiggestUtxo(utxos) {
  let largestAmount = 0;
  let largestIndex = 0;

  for (var i = 0; i < utxos.length; i++) {
    const thisUtxo = utxos[i];

    if (thisUtxo.satoshis > largestAmount) {
      largestAmount = thisUtxo.satoshis;
      largestIndex = i;
    }
  }

  return utxos[largestIndex];
}

//module.exports = memoPush

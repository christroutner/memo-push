const { Command, flags } = require("@oclif/command")

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

// Send the Permissionless Software Foundation a donation to thank them for creating
// and maintaining this software.
const PSF_DONATION = 2000
const bchDonation = require("bch-donation")

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const WIF = process.env.WIF

let _this

class MemoPushCommand extends Command {
  constructor(argv, config) {
    super(argv, config)

    _this = this

    this.bchjs = bchjs
  }

  async run() {
    const { flags } = this.parse(MemoPushCommand)

    try {
      const hash = flags.publish

      if (hash && hash !== "") {
        // Exit if the WIF is not defined in the environment variable.
        if (!WIF || WIF === "") {
          console.log(
            `Please add your WIF key to the WIF environment variable.`
          )
          return
        }

        // Create an EC Key Pair from the user-supplied WIF.
        const ecPair = _this.bchjs.ECPair.fromWIF(WIF)

        // Generate the public address that corresponds to this WIF.
        const ADDR = _this.bchjs.ECPair.toCashAddress(ecPair)
        console.log(`Publishing ${hash} to ${ADDR}`)

        // Prefact text to put in front of the message.
        const preface = "IPFS UPDATE"

        const txidStr = await this.publish(hash, WIF, preface)

        console.log(`Transaction ID: ${txidStr}`)
        console.log(`https://memo.cash/post/${txidStr}`)
        console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)
      }

      //this.log(`hello ${name} from ./src/index.js`)
    } catch (err) {
      console.error(err)
    }
  }

  // Publish an IPFS hash to the blockchain. Pay for the TX with the WIF.
  // Optional preface text will replace the default 'IPFS UPDATE' used to
  // signal updates for the ipfs-web-server.
  async publish(hash, wif, preface) {
    try {
      // Create an EC Key Pair from the user-supplied WIF.
      const ecPair = _this.bchjs.ECPair.fromWIF(wif)

      // Generate the public address that corresponds to this WIF.
      const ADDR = _this.bchjs.ECPair.toCashAddress(ecPair)
      // console.log(`Publishing ${hash} to ${ADDR}`)

      // Pick a UTXO controlled by this address.
      const u = await _this.bchjs.Blockbook.utxo(ADDR)
      const utxo = findBiggestUtxo(u)

      // instance of transaction builder
      const transactionBuilder = new _this.bchjs.TransactionBuilder()

      //const satoshisToSend = SATOSHIS_TO_SEND
      const originalAmount = utxo.satoshis
      const vout = utxo.vout
      const txid = utxo.txid

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // TODO: Compute the 1 sat/byte fee.
      const fee = 500

      // Send the same amount - fee.
      transactionBuilder.addOutput(ADDR, originalAmount - fee - PSF_DONATION)

      // Default preface, or override if user specified.
      let prefaceStr = "IPFS UPDATE"
      if (preface) prefaceStr = preface

      // Add the memo.cash OP_RETURN to the transaction.
      const script = [
        _this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from("6d02", "hex"),
        Buffer.from(`${prefaceStr} ${hash}`)
      ]

      //console.log(`script: ${util.inspect(script)}`);
      const data = _this.bchjs.Script.encode2(script)
      //console.log(`data: ${util.inspect(data)}`);
      transactionBuilder.addOutput(data, 0)

      // Send a 2000 sat donation to PSF for creating and maintaining this software.
      transactionBuilder.addOutput(bchDonation("psf").donations, PSF_DONATION)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        ecPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()
      // console.log(`TX hex: ${hex}`)
      //console.log(` `);

      // Broadcast transation to the network
      const txidStr = await _this.bchjs.RawTransactions.sendRawTransaction(hex)

      return txidStr
    } catch (err) {
      console.error(`Error in memo-push/publish()`)
      throw err
    }
  }
}

MemoPushCommand.description = `Publish IPFS to memo.cash
Publish IPFS hashes to the BCH blockchain using the memo.cash protocol
`

MemoPushCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // add --help flag to show CLI version
  help: flags.help({ char: "h" }),
  publish: flags.string({ char: "p", description: "IPFS hash to publish" })
}

// Returns the utxo with the biggest balance from an array of utxos.
function findBiggestUtxo(utxos) {
  let largestAmount = 0
  let largestIndex = 0

  for (var i = 0; i < utxos.length; i++) {
    const thisUtxo = utxos[i]

    if (thisUtxo.satoshis > largestAmount) {
      largestAmount = thisUtxo.satoshis
      largestIndex = i
    }
  }

  return utxos[largestIndex]
}

module.exports = MemoPushCommand

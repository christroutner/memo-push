const { Command, flags } = require("@oclif/command")

// const BITBOXSDK = require("bitbox-sdk")
// const BITBOX = new BITBOXSDK()

const BCHJS = require("@chris.troutner/bch-js")
const bchjs = new BCHJS()

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
        transactionBuilder.addOutput(ADDR, originalAmount - fee)

        // Add the memo.cash OP_RETURN to the transaction.
        const script = [
          _this.bchjs.Script.opcodes.OP_RETURN,
          Buffer.from("6d02", "hex"),
          Buffer.from(`TEST ${hash}`)
        ]

        //console.log(`script: ${util.inspect(script)}`);
        const data = _this.bchjs.Script.encode(script)
        //console.log(`data: ${util.inspect(data)}`);
        transactionBuilder.addOutput(data, 0)

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
        //console.log(`TX hex: ${hex}`);
        //console.log(` `);

        // Broadcast transation to the network
        const txidStr = await _this.bchjs.RawTransactions.sendRawTransaction(
          hex
        )
        console.log(`Transaction ID: ${txidStr}`)
        console.log(`https://memo.cash/post/${txidStr}`)
        console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)

        await sleep(5000)
        console.log(" ")
        console.log(" ")

        const obj1 = {
          txid: txidStr,
          msg: "This is the first test reply"
        }
        const reply1Txid = await reply(obj1)

        await sleep(5000)
        console.log(" ")
        console.log(" ")

        const obj2 = {
          txid: reply1Txid,
          msg: "This is the second test reply"
        }
        const reply2Txid = await reply(obj2)

        console.log(" ")
        console.log(`member.cash post:`)
        console.log(
          `https://member.cash/index.html#thread?root=${txidStr}&post=${reply2Txid}`
        )
      }

      //this.log(`hello ${name} from ./src/index.js`)
    } catch (err) {
      console.error(err)
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Expects an object as input. The object must have the following properties:
// obj.txid = Transaction ID of previous memo that is being replied to.
// obj.msg = The message to include in the reply.
async function reply(obj) {
  try {
    // Create an EC Key Pair from the user-supplied WIF.
    const ecPair = _this.bchjs.ECPair.fromWIF(WIF)

    // Generate the public address that corresponds to this WIF.
    const ADDR = _this.bchjs.ECPair.toCashAddress(ecPair)
    console.log(`Replying with '${obj.msg}' to ${ADDR}`)

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
    transactionBuilder.addOutput(ADDR, originalAmount - fee)

    const endChg = changeEndian(obj.txid)
    // console.log(`Original txid: ${obj.txid}`)
    // console.log(`txid endian swapped: ${endChg}`)

    // Add the memo.cash OP_RETURN to the transaction.
    const script = [
      _this.bchjs.Script.opcodes.OP_RETURN,
      Buffer.from("6d03", "hex"),
      Buffer.from(endChg, "hex"),
      Buffer.from(`REPLY ${obj.msg}`)
    ]

    //console.log(`script: ${util.inspect(script)}`);
    const data = _this.bchjs.Script.encode(script)
    //console.log(`data: ${util.inspect(data)}`);
    transactionBuilder.addOutput(data, 0)

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
    //console.log(`TX hex: ${hex}`);
    //console.log(` `);

    // Broadcast transation to the network
    const txidStr = await _this.bchjs.RawTransactions.sendRawTransaction(hex)
    console.log(`Transaction ID: ${txidStr}`)
    console.log(`https://memo.cash/post/${txidStr}`)
    console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)

    return txidStr
  } catch (err) {
    console.error(`Error in reply(): `, err)
  }
}

// Change the endianness of a hex string.
function changeEndian(str) {
  try {
    //https://stackoverflow.com/questions/44287769/parsing-a-little-endian-hex-string-to-decimal
    if (!str) return undefined

    var len = str.length
    var bigEndianHexString = ""
    for (var i = 0; i < len / 2; i++)
      bigEndianHexString += str.substring(len - (i + 1) * 2, len - i * 2)

    return bigEndianHexString
  } catch (err) {
    console.error(`Error in changeEndian(): `, err)
  }
}

module.exports = MemoPushCommand

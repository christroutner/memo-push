const { Command, flags } = require("@oclif/command")

const BITBOXSDK = require("bitbox-sdk")
const BITBOX = new BITBOXSDK()

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const WIF = process.env.WIF

class MemoPushCommand extends Command {
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
        const ecPair = BITBOX.ECPair.fromWIF(WIF)

        // Generate the public address that corresponds to this WIF.
        const ADDR = BITBOX.ECPair.toCashAddress(ecPair)
        console.log(`Publishing ${hash} to ${ADDR}`)

        // Pick a UTXO controlled by this address.
        const u = await BITBOX.Address.utxo(ADDR)
        const utxo = findBiggestUtxo(u.utxos)

        // instance of transaction builder
        const transactionBuilder = new BITBOX.TransactionBuilder()

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
          BITBOX.Script.opcodes.OP_RETURN,
          Buffer.from("6d02", "hex"),
          Buffer.from(`IPFS UPDATE ${hash}`)
        ]

        //console.log(`script: ${util.inspect(script)}`);
        const data = BITBOX.Script.encode(script)
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
        const txidStr = await BITBOX.RawTransactions.sendRawTransaction(hex)
        console.log(`Transaction ID: ${txidStr}`)
        console.log(`https://memo.cash/post/${txidStr}`)
        console.log(`https://explorer.bitcoin.com/bch/tx/${txidStr}`)
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

module.exports = MemoPushCommand

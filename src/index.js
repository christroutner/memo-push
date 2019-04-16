const {Command, flags} = require('@oclif/command')

class MemoPushCommand extends Command {
  async run() {
    const {flags} = this.parse(MemoPushCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/index.js`)
  }
}

MemoPushCommand.description = `Describe the command here
...
Extra documentation goes here
`

MemoPushCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = MemoPushCommand

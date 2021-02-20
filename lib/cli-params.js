/** @typedef { import('./types').CliParams } CliParams */

const minimist = require('minimist')
const pkg = require('../package.json')
const { log } = require('./log')

module.exports = {
  getCliParams,
}

const DEFAULT_PORT = '3456'

const minimistOpts = {
  boolean: ['help', 'version', 'list' ],
  alias: {
    h: 'help',
    v: 'version',
    l: 'list',
  },
}

/** @type { (argv?: string[]) => CliParams } */
function getCliParams(argv) {
  if (!argv) argv = process.argv.slice(2)
  const args = minimist(argv, minimistOpts)

  if (args.help) help()
  if (args.version) version()
  if (args.list) return { listPorts: true }

  const [ aMidiDevice, vMidiDevice, ...rest ] = args._
  if (!aMidiDevice) help()

  if (rest.length !== 0) {
    log(`extraneous parameters ignored: ${JSON.stringify(rest)}`)
  }

  return { aMidiDevice, vMidiDevice }
}

function version() {
  console.log(pkg.version)
  process.exit(1)
}

function help() {
  console.log(`
${pkg.name} v${pkg.version}

Displays midi messages output from a specified midi device, and messages sent
to the device from a virtual midi port you can direct other software to, as a
man-in-the-middle.

The messages are colored GREEN if they are being sent FROM the device, and are
colored RED if they are being sent TO the device.  Lines looks like this:

    <-      0.000 [ 0] ccg   2   0
    <-      0.000 [ 0] ccg   1   0
    ->      0.000 [13] ccg  17 103
    ->      0.192 [13] ccg  17 104

The first two messages are being sent TO the device, the last two are being
sent FROM the device - the arrows also indicate the direction.

The floating point number is the deltaTime, and each "direction" maintains
their own values.  The bracketed number is the channel. The three letter
symbol is the MIDI command.  The data follows, in decimal.  Sysex messages
are displayed in hex.

usage:
    ${pkg.name} midi-port [virtual-midi-port]

where:
    midi-port          is the name of the midi port to monitor
    virtual-midi-port  is the optional name of a virtual midi port to create

options:
    -l --list          list available midi ports
    -h --help          print this help
    -v --version       print program version

If no parameters are provided the list of available midi ports is printed.

If one parameter is provided, the midi port will be opened and all data read
from it will be printed.

If two parameters are provided, the first is an actual midi port, and the
second is a virtual midi port that will be created.  Any data written to the
virtual midi port will be printed, and sent to the actual midi port.  And data
received from the actuual midi port will be printed and sent to the virtual
midi port.  You can use this as a man-in-the-middle when connecting a device
to a computer to sniff all the traffic.

The DEBUG environment variable can be set to anything for debug logging.

For more information, go to ${pkg.homepage}
`.trim())
  process.exit(1)
}


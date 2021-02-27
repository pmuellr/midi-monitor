#!/usr/bin/env node

/** @typedef { import('./lib/types').OnMessage } OnMessage */
/** @typedef { import('./lib/types').MidiPort } MidiPort */

const chalk = require('chalk')
const hexer = require('hexer')

const { log } = require('./lib/log')
const midiPort = require('./lib/midi-port')
const cliParams = require('./lib/cli-params')

if (require.main === module) main() 

async function main() {
  const params = cliParams.getCliParams(process.argv.slice(2))
  const { aMidiDevice, vMidiDevice, listPorts } = params

  if (listPorts) {
    const iPorts = midiPort.getInputPorts()
    const oPorts = midiPort.getOutputPorts()

    console.log('input ports:')
    iPorts.forEach(port => console.log(`    ${port}`))
    console.log('output ports:')
    oPorts.forEach(port => console.log(`    ${port}`))
    process.exit(0)
  }

  /** @type { MidiPort } */
  let vPort

  /** @type { MidiPort } */
  let aPort

  /** @type { OnMessage } */
  function onMessageVirtual(deltaTime, message) {
    const color = chalk.red.bgBlack
    logMessage('<-', color, deltaTime, message)
    aPort.sendMessage(message)
  }

  /** @type { OnMessage } */
  function onMessageActual(deltaTime, message) {
    const color = chalk.green.bgBlack
    logMessage('->', color, deltaTime, message)
    if (vPort) vPort.sendMessage(message)
  }

  if (vMidiDevice) {
    try {
      vPort = midiPort.createVirtualMidiPort({ 
        name: vMidiDevice,
        onMessage: onMessageVirtual
      })
    } catch (err) {
      log.exitError(`error creating virtual midi port "${vMidiDevice}": ${err}`)
    }
  }

  try {
    aPort = midiPort.createActualMidiPort({ 
      name: aMidiDevice,
      onMessage: onMessageActual
    })
  } catch (err) {
    log.exitError(`error opening actual midi port "${aMidiDevice}": ${err}`)
  }
}

/** @type { (prefix: string, color: chalk.Chalk, deltaTime: number, message: number[]) => void } */
function logMessage(prefix, color, deltaTime, message) {
  const pDeltaTime = printableDeltaTime(deltaTime)
  const pMessage = printableMessage(message)
  console.log(color(`${prefix} ${pDeltaTime} ${pMessage}`))
}

/** @type { (message: number[]) => string } */
function printableMessage(message) {
  const { command, channel } = getCommandChannel(message)
  return `${formatChannel(channel)} ${command}`
}

/** @type { (deltaTime: number) => string } */
function printableDeltaTime(deltaTime) {
  if (deltaTime > 1000 * 1000) return '**********'
  const pDeltaTime = deltaTime.toLocaleString(undefined, { minimumFractionDigits: 3 })
  return `${pDeltaTime}`.padStart(10)
}

/** @type { (channel: number) => string } */
function formatChannel(channel) {
  if (channel == null) return '    '

  const pChannel = `${channel}`.padStart(2)
  return `[${pChannel}]`
}

/** @type { (message: number[]) => { command: string, channel?: number } } */
function getCommandChannel(message) {
  const printableMessage = hexer(Buffer.from(message))
  const [ status, data1 ] = message
  const status1 = (status & 0xF0)
  const status2 = (status & 0x0F)

  /** { string } */
  let command

  /** { number } */
  let channel = status2

  function p(n) { return `${message[n]}`.padStart(3)}
  const short = `${message[1] * 256 + message[2]}`.padStart(5)

  if (status1 === 0x80) command = `nof ${p(1)} ${p(2)}`
  if (status1 === 0x90) command = `non ${p(1)} ${p(2)}`
  if (status1 === 0xA0) command = `aft ${p(1)} ${p(2)}`
  if (status1 === 0xB0) command = `ccg ${p(1)} ${p(2)}`
  if (status1 === 0xC0) command = `pcg ${p(1)}`
  if (status1 === 0xD0) command = `chp ${p(1)}`
  if (status1 === 0xE0) command = `pib ${short}`
  if (status1 === 0xF0) command = `sysex\n${printableMessage}`

  if (status1 === 0xF0) channel = undefined

  if (status1 === 0xB0) {
    if (data1 === 0x79) command = `rac`
    if (data1 === 0x7A) command = `loc ${p(2)}`
    if (data1 === 0x7B) command = `ano`
    if (data1 === 0x7C) command = `oof`
    if (data1 === 0x7D) command = `oon`
    if (data1 === 0x7E) command = `mon`
    if (data1 === 0x7F) command = `pon`
  }

  if (!command) {
    command = `???\n${printableMessage}`
    channel = undefined
  }

  return { command, channel }
}

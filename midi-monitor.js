#!/usr/bin/env node

/** @typedef { import('./lib/types').OnMessage } OnMessage */
/** @typedef { import('./lib/types').MidiPort } MidiPort */

const chalk = require('chalk')
const hexer = require('hexer')

const set = require('./lib/set')
const { log } = require('./lib/log')
const midiPort = require('./lib/midi-port')
const cliParams = require('./lib/cli-params')

if (require.main === module) main() 

async function main() {
  const params = cliParams.getCliParams(process.argv.slice(2))
  const { aMidiDevice, vMidiDevice, listPorts, opts } = params

  if (listPorts) {
    const iPorts = new Set(midiPort.getInputPorts())
    const oPorts = new Set(midiPort.getOutputPorts())

    const ioPorts = set.filter(iPorts, (port) => oPorts.has(port))
    const isPorts = set.filter(iPorts, (port) => !oPorts.has(port))
    const osPorts = set.filter(oPorts, (port) => !iPorts.has(port))

    console.log('input-output ports:')
    ioPorts.forEach(port => console.log(`    ${port}`))

    if (isPorts) {
      console.log('input-only ports:')
      isPorts.forEach(port => console.log(`    ${port}`))
    }

    if (osPorts) {
      console.log('output-only ports:')
      osPorts.forEach(port => console.log(`    ${port}`))
    }

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
        onMessage: onMessageVirtual,
        opts
      })
    } catch (err) {
      log.exitError(`error creating virtual midi port "${vMidiDevice}": ${err}`)
    }
  }

  try {
    aPort = midiPort.createActualMidiPort({ 
      name: aMidiDevice,
      onMessage: onMessageActual,
      opts
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

  if (status1 === 0x80) command = `8x note off      ${p(1)} ${p(2)}`
  if (status1 === 0x90) command = `9x note on       ${p(1)} ${p(2)}`
  if (status1 === 0xA0) command = `Ax aftertouch    ${p(1)} ${p(2)}`
  if (status1 === 0xB0) command = `Bx control chg   ${p(1)} ${p(2)}`
  if (status1 === 0xC0) command = `Cx program chg   ${p(1)}`
  if (status1 === 0xD0) command = `Dx pressure      ${p(1)}`
  if (status1 === 0xE0) command = `Ex pitch bend    ${short}`

  if (status1 === 0xF0) channel = undefined
  if (status === 0xF0) command = `F0 sysex\n${printableMessage}`
  if (status === 0xF1) command = `F1 mtc qtr frame ${p(1)}`
  if (status === 0xF2) command = `F2 song position ${short}`
  if (status === 0xF3) command = `F3 song select   ${p(1)}`
  if (status === 0xF6) command = `F6 tune request`
  if (status === 0xF8) command = `F8 midi clock tick`
  if (status === 0xFA) command = `FA play start`
  if (status === 0xFB) command = `FB play continue`
  if (status === 0xFC) command = `FC play stop`
  if (status === 0xFE) command = `FE active sense`
  if (status === 0xFF) command = `FF panic`
  

  if (status1 === 0xB0) {
    if (data1 === 0x78) command = `Bx 78 all sound off`
    if (data1 === 0x79) command = `Bx 79 reset all controllers`
    if (data1 === 0x7A) command = `Bx 7A local control ${p(2)}`
    if (data1 === 0x7B) command = `Bx 7B all notes off`
    if (data1 === 0x7C) command = `Bx 7C omni mode off`
    if (data1 === 0x7D) command = `Bx 7D omni mode on`
    if (data1 === 0x7E) command = `Bx 7E mono mode on`
    if (data1 === 0x7F) command = `Bx 7F poly mode on ${p(2)}`
  }

  if (!command) {
    command = `???\n${printableMessage}`
    channel = undefined
  }

  return { command, channel }
}


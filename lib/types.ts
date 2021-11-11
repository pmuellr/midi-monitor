export interface MidiPortOptions {
  active: boolean;
  sysex: boolean;
  timing: boolean;
}

export interface CliParams {
  opts: MidiPortOptions

  // actual midi device
  aMidiDevice?: string

  // virtual midi device
  vMidiDevice?: string

  // indicates the ports should be listed
  listPorts?: boolean

  // number of columns for hex display
  columns: number

  // print input only
  inputOnly: boolean

  // print output only
  outputOnly: boolean
}

export type OnMessage = (deltaTime: number, message: number[]) => void

export interface MidiPort {
  readonly name: string;
  close(): void
  sendMessage(bytes: number[]): void
}

export interface CreateMidiPortsParams {
  name: string
  onMessage: OnMessage
  opts: MidiPortOptions
}

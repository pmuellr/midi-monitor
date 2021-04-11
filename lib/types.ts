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

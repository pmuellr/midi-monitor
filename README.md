midi-monitor - monitor the output of midi ports, and maybe input
================================================================================

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


usage
================================================================================

After installing, run the following for usage help

    midi-monitor -h

installation
================================================================================

    npm install -g pmuellr/midi-monitor


changelog
================================================================================

version 1.2.1 - 2021-04-11

- made the CLI toggle for sysex, timing and active-sensing boolean options
  for easier usage (combining after a single -)

version 1.2.0 - 2021-04-11

- CLI toggle for sysex, timing and active-sensing
- better listing of ports
- better listing of messages

version 1.1.0 - 2021-02-27

- actually support sysex, and now with a nice hex dump

version 1.0.0 - 2021-02-??

- shipped as 1.0

version 0.0.1 - 2021-02-19

- initial version, under active development


license
================================================================================

This package is licensed under the MIT license.  See the [LICENSE.md][] file
for more information.


contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md][] file for more information.


[LICENSE.md]: LICENSE.md
[CONTRIBUTING.md]: CONTRIBUTING.md
[CHANGELOG.md]: CHANGELOG.md
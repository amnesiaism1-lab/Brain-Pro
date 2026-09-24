/**
 * Web MIDI API Service
 * Handles MIDI device access, connection, device hot-plugging,
 * and MIDI Note On / Note Off / Control Change events.
 */

export interface IMidiInput {
  id: string;
  name?: string;
  manufacturer?: string;
  state: string;
  type: string;
  onmidimessage: ((event: IMidiMessageEvent) => void) | null;
}

export interface IMidiMessageEvent {
  data: Uint8Array;
}

export interface IMidiConnectionEvent {
  port: IMidiInput;
}

export interface IMidiAccess {
  inputs: Map<string, IMidiInput>;
  onstatechange: ((event: IMidiConnectionEvent) => void) | null;
}

interface NavigatorWithMidi {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<IMidiAccess>;
}

export interface IMidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export type MidiNoteOnCallback = (note: string, velocity: number, midiNumber: number) => void;
export type MidiNoteOffCallback = (note: string, midiNumber: number) => void;
export type MidiDeviceChangeCallback = (devices: IMidiDevice[]) => void;

// Conversion between MIDI note number (0-127) and Scientific Pitch Notation (e.g. 60 -> 'C4')
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNumberToNoteName(midiNumber: number): string {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function noteNameToMidiNumber(noteName: string): number {
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/i);
  if (!match) return 60; // default Middle C
  let name = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  // Normalize flats to sharps
  const flatMap: Record<string, string> = {
    'DB': 'C#', 'EB': 'D#', 'GB': 'F#', 'AB': 'G#', 'BB': 'A#'
  };
  if (flatMap[name]) {
    name = flatMap[name];
  }

  const noteIndex = NOTE_NAMES.indexOf(name);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

class MidiService {
  private midiAccess: IMidiAccess | null = null;
  private activeInput: IMidiInput | null = null;
  private noteOnListeners: Set<MidiNoteOnCallback> = new Set();
  private noteOffListeners: Set<MidiNoteOffCallback> = new Set();
  private deviceChangeListeners: Set<MidiDeviceChangeCallback> = new Set();
  private requested = false;

  public get isSupported(): boolean {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as unknown as NavigatorWithMidi;
    return typeof nav.requestMIDIAccess === 'function';
  }

  public get isConnected(): boolean {
    return this.activeInput !== null && this.activeInput.state === 'connected';
  }

  public get activeDeviceName(): string | null {
    if (!this.activeInput) return null;
    return this.activeInput.name || 'MIDI Device';
  }

  public async requestAccess(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Web MIDI API is not supported in this browser.');
      return false;
    }

    if (this.midiAccess) {
      return true;
    }

    if (this.requested) {
      return this.isConnected;
    }

    this.requested = true;

    try {
      const nav = navigator as unknown as NavigatorWithMidi;
      if (!nav.requestMIDIAccess) return false;

      this.midiAccess = await nav.requestMIDIAccess({ sysex: false });
      
      // Auto connect to first available MIDI input
      this.autoSelectInput();

      // Listen for hot-plug events (device plugged in or unplugged)
      this.midiAccess.onstatechange = (event: IMidiConnectionEvent) => {
        this.handleStateChange(event);
      };

      return true;
    } catch (err) {
      console.warn('Failed to access Web MIDI API:', err);
      return false;
    }
  }

  public getDevices(): IMidiDevice[] {
    if (!this.midiAccess) return [];
    const devices: IMidiDevice[] = [];
    this.midiAccess.inputs.forEach((input: IMidiInput) => {
      devices.push({
        id: input.id,
        name: input.name || `MIDI Input (${input.id})`,
        manufacturer: input.manufacturer || 'Generic',
        state: input.state
      });
    });
    return devices;
  }

  public selectDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;
    const input = this.midiAccess.inputs.get(deviceId);
    if (input) {
      this.attachInput(input);
      return true;
    }
    return false;
  }

  private autoSelectInput(): void {
    if (!this.midiAccess) return;
    const inputs = Array.from(this.midiAccess.inputs.values());
    if (inputs.length > 0) {
      // Pick first connected input
      const connected = inputs.find((i: IMidiInput) => i.state === 'connected') || inputs[0];
      this.attachInput(connected);
    }
    this.notifyDeviceChange();
  }

  private attachInput(input: IMidiInput): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
    }
    this.activeInput = input;
    this.activeInput.onmidimessage = (event: IMidiMessageEvent) => {
      this.handleMidiMessage(event);
    };
    this.notifyDeviceChange();
  }

  private handleMidiMessage(event: IMidiMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const command = data[0] >> 4;
    const noteNumber = data[1];
    const velocity = data[2];

    const noteName = midiNumberToNoteName(noteNumber);

    // Command 9 = Note On (with velocity > 0), Command 8 = Note Off (or Note On with velocity 0)
    if (command === 9 && velocity > 0) {
      const normalizedVelocity = velocity / 127;
      this.noteOnListeners.forEach(cb => {
        try {
          cb(noteName, normalizedVelocity, noteNumber);
        } catch (e) {
          console.error('Error in MIDI noteOn listener:', e);
        }
      });
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      this.noteOffListeners.forEach(cb => {
        try {
          cb(noteName, noteNumber);
        } catch (e) {
          console.error('Error in MIDI noteOff listener:', e);
        }
      });
    }
  }

  private handleStateChange(event: IMidiConnectionEvent): void {
    const port = event.port;
    if (port && port.type === 'input') {
      if (port.state === 'connected' && (!this.activeInput || this.activeInput.state !== 'connected')) {
        this.attachInput(port);
      } else if (port.state === 'disconnected' && this.activeInput?.id === port.id) {
        this.activeInput = null;
        this.autoSelectInput();
      }
      this.notifyDeviceChange();
    }
  }

  private notifyDeviceChange(): void {
    const devices = this.getDevices();
    this.deviceChangeListeners.forEach(cb => {
      try {
        cb(devices);
      } catch (e) {
        console.error('Error in MIDI deviceChange listener:', e);
      }
    });
  }

  public onNoteOn(callback: MidiNoteOnCallback): () => void {
    this.noteOnListeners.add(callback);
    return () => this.noteOnListeners.delete(callback);
  }

  public onNoteOff(callback: MidiNoteOffCallback): () => void {
    this.noteOffListeners.add(callback);
    return () => this.noteOffListeners.delete(callback);
  }

  public onDeviceChange(callback: MidiDeviceChangeCallback): () => void {
    this.deviceChangeListeners.add(callback);
    return () => this.deviceChangeListeners.delete(callback);
  }

  public disconnect(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
    this.noteOnListeners.clear();
    this.noteOffListeners.clear();
    this.deviceChangeListeners.clear();
  }
}

export const midiService = new MidiService();

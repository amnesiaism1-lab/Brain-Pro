import { useState, useEffect, useCallback, useRef } from 'react';
import { midiService, IMidiDevice } from '../services/midiService';
import { auditoryEngine } from '../services/auditoryEngine';

export interface IUseMidiInputOptions {
  autoPlayAudio?: boolean;
  onNoteOn?: (note: string, velocity: number, midiNumber: number) => void;
  onNoteOff?: (note: string, midiNumber: number) => void;
}

export function useMidiInput(options: IUseMidiInputOptions = {}) {
  const { autoPlayAudio = true, onNoteOn, onNoteOff } = options;

  const [isSupported] = useState<boolean>(() => midiService.isSupported);
  const [isConnected, setIsConnected] = useState<boolean>(() => midiService.isConnected);
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(() => midiService.activeDeviceName);
  const [devices, setDevices] = useState<IMidiDevice[]>(() => midiService.getDevices());
  const [activeMidiNotes, setActiveMidiNotes] = useState<string[]>([]);

  // Stable callback refs
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  const autoPlayAudioRef = useRef(autoPlayAudio);

  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
    onNoteOffRef.current = onNoteOff;
    autoPlayAudioRef.current = autoPlayAudio;
  });

  const requestAccess = useCallback(async () => {
    const success = await midiService.requestAccess();
    setIsConnected(midiService.isConnected);
    setActiveDeviceName(midiService.activeDeviceName);
    setDevices(midiService.getDevices());
    return success;
  }, []);

  const selectDevice = useCallback((deviceId: string) => {
    const success = midiService.selectDevice(deviceId);
    setIsConnected(midiService.isConnected);
    setActiveDeviceName(midiService.activeDeviceName);
    return success;
  }, []);

  useEffect(() => {
    // Listen for device changes
    const unsubDevice = midiService.onDeviceChange((newDevices) => {
      setDevices(newDevices);
      setIsConnected(midiService.isConnected);
      setActiveDeviceName(midiService.activeDeviceName);
    });

    // Listen for Note On
    const unsubNoteOn = midiService.onNoteOn((note, velocity, midiNumber) => {
      setActiveMidiNotes(prev => prev.includes(note) ? prev : [...prev, note]);

      if (autoPlayAudioRef.current) {
        auditoryEngine.resumeAudioContext().catch(() => {});
        auditoryEngine.playNote(note, 0.45, { volume: Math.max(0.2, velocity) });
      }

      if (onNoteOnRef.current) {
        onNoteOnRef.current(note, velocity, midiNumber);
      }
    });

    // Listen for Note Off
    const unsubNoteOff = midiService.onNoteOff((note, midiNumber) => {
      setActiveMidiNotes(prev => prev.filter(n => n !== note));

      if (onNoteOffRef.current) {
        onNoteOffRef.current(note, midiNumber);
      }
    });

    return () => {
      unsubDevice();
      unsubNoteOn();
      unsubNoteOff();
    };
  }, []);

  return {
    isSupported,
    isConnected,
    activeDeviceName,
    devices,
    activeMidiNotes,
    requestAccess,
    selectDevice
  };
}

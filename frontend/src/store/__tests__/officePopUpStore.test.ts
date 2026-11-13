import { describe, it, expect, beforeEach } from 'vitest';
import { useVocalStudioStore } from '../vocalStudioStore';

describe('VocalStudioStore - Office Pop-up & PiP State', () => {
  beforeEach(() => {
    useVocalStudioStore.setState({
      isOpen: false,
      isOfficePopUpOpen: false,
      isBossKeyTriggered: false,
      officeLayout: 'card',
      officeTheme: 'spotify',
      officeInputMode: 'humming',
      officeMaxDbThreshold: 45,
      officeAutoMuteOnBlur: true,
      isPlaying: false,
      isMutedMusic: false,
    });
  });

  it('should initialize with default office preferences', () => {
    const state = useVocalStudioStore.getState();
    expect(state.isOfficePopUpOpen).toBe(false);
    expect(state.officeLayout).toBe('card');
    expect(state.officeTheme).toBe('spotify');
    expect(state.officeInputMode).toBe('humming');
    expect(state.officeMaxDbThreshold).toBe(45);
    expect(state.officeAutoMuteOnBlur).toBe(true);
  });

  it('should open office popup and close full modal', () => {
    useVocalStudioStore.getState().openStudio();
    expect(useVocalStudioStore.getState().isOpen).toBe(true);

    useVocalStudioStore.getState().openOfficePopUp();
    const state = useVocalStudioStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.isOfficePopUpOpen).toBe(true);
  });

  it('should close office popup cleanly', () => {
    useVocalStudioStore.getState().openOfficePopUp();
    expect(useVocalStudioStore.getState().isOfficePopUpOpen).toBe(true);

    useVocalStudioStore.getState().closeOfficePopUp();
    expect(useVocalStudioStore.getState().isOfficePopUpOpen).toBe(false);
  });

  it('should toggle layouts and themes correctly', () => {
    useVocalStudioStore.getState().setOfficeLayout('ribbon');
    expect(useVocalStudioStore.getState().officeLayout).toBe('ribbon');

    useVocalStudioStore.getState().setOfficeTheme('stealth-code');
    expect(useVocalStudioStore.getState().officeTheme).toBe('stealth-code');
  });

  it('should trigger boss key panic action in under 1ms', () => {
    useVocalStudioStore.setState({ isPlaying: true, isOfficePopUpOpen: true, isMutedMusic: false });

    useVocalStudioStore.getState().triggerBossKey();

    const state = useVocalStudioStore.getState();
    expect(state.isBossKeyTriggered).toBe(true);
    expect(state.isOfficePopUpOpen).toBe(false);
    expect(state.isOpen).toBe(false);
    expect(state.isPlaying).toBe(false);
    expect(state.isMutedMusic).toBe(true);
  });

  it('should restore from boss key', () => {
    useVocalStudioStore.getState().triggerBossKey();
    expect(useVocalStudioStore.getState().isBossKeyTriggered).toBe(true);

    useVocalStudioStore.getState().restoreFromBossKey();
    const state = useVocalStudioStore.getState();
    expect(state.isBossKeyTriggered).toBe(false);
    expect(state.isMutedMusic).toBe(false);
  });
});

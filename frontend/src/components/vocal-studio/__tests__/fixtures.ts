/**
 * In-memory Audio Fixtures & DSP Test Helpers for Vocal Studio
 * Generates test audio buffers purely in code without relying on external WAV files.
 */

export interface ISyntheticNote {
  freqHz: number;
  durSec: number;
}

/**
 * Generate Float32Array PCM samples for a sequence of notes
 */
export function generateSyntheticMelody(
  notes: ISyntheticNote[],
  sampleRate = 44100,
  options: {
    addSecondHarmonic?: number;
    addNoiseSnrDb?: number;
    pauseSec?: number;
    vibratoRateHz?: number;
    vibratoDepthCents?: number;
  } = {}
): Float32Array {
  const pauseSec = options.pauseSec ?? 0.15;
  const totalDuration = notes.reduce((acc, n) => acc + n.durSec + pauseSec, 0) + 0.2;
  const totalSamples = Math.ceil(sampleRate * totalDuration);
  const buffer = new Float32Array(totalSamples);

  let cursor = 0;
  for (const item of notes) {
    const noteSamples = Math.floor(item.durSec * sampleRate);
    const h2Gain = options.addSecondHarmonic ?? 0.3;

    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      let freq = item.freqHz;

      if (options.vibratoRateHz && options.vibratoDepthCents) {
        const vibratoFactor = Math.pow(2, (Math.sin(2 * Math.PI * options.vibratoRateHz * t) * options.vibratoDepthCents) / 1200);
        freq = item.freqHz * vibratoFactor;
      }

      // Envelope: 40ms attack, 40ms decay
      let env = 1.0;
      const attackSamples = Math.floor(0.04 * sampleRate);
      const releaseSamples = Math.floor(0.04 * sampleRate);
      if (i < attackSamples) env = i / attackSamples;
      else if (i > noteSamples - releaseSamples) env = (noteSamples - i) / releaseSamples;

      const f1 = Math.sin(2 * Math.PI * freq * t);
      const f2 = Math.sin(2 * Math.PI * (freq * 2) * t) * h2Gain;
      let sample = (f1 + f2) * 0.4 * env;

      if (options.addNoiseSnrDb != null) {
        const noiseGain = Math.pow(10, -options.addNoiseSnrDb / 20);
        const noise = (Math.random() * 2 - 1) * noiseGain;
        sample += noise;
      }

      if (cursor + i < totalSamples) {
        buffer[cursor + i] = sample;
      }
    }

    cursor += noteSamples + Math.floor(pauseSec * sampleRate);
  }

  return buffer;
}

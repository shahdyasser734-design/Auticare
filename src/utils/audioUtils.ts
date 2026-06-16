// src/utils/audioUtils.ts

/**
 * Converts a WebM/Ogg audio Blob (e.g. from MediaRecorder) to a standard WAV Blob.
 * Required for backend compatibility (.wav format).
 */
export async function convertAudioToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  
  // Use AudioContext to decode the original format (webm/ogg)
  const audioContext = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Encode to WAV
  const wavArrayBuffer = encodeWAV(audioBuffer);
  return new Blob([wavArrayBuffer], { type: 'audio/wav' });
}

function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numOfChan * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  let offset = 0;
  
  // Helper to write strings
  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };
  
  // RIFF identifier
  writeString('RIFF');
  // file length
  view.setUint32(offset, 36 + length, true); offset += 4;
  // RIFF type
  writeString('WAVE');
  // format chunk identifier
  writeString('fmt ');
  // format chunk length
  view.setUint32(offset, 16, true); offset += 4;
  // sample format (raw)
  view.setUint16(offset, 1, true); offset += 2;
  // channel count
  view.setUint16(offset, numOfChan, true); offset += 2;
  // sample rate
  view.setUint32(offset, sampleRate, true); offset += 4;
  // byte rate (sample rate * block align)
  view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
  // block align (channel count * bytes per sample)
  view.setUint16(offset, numOfChan * 2, true); offset += 2;
  // bits per sample
  view.setUint16(offset, 16, true); offset += 2;
  // data chunk identifier
  writeString('data');
  // data chunk length
  view.setUint32(offset, length, true); offset += 4;
  
  // Write interleaved PCM data
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    let sampleOffset = offset + (i * 2);
    
    for (let j = 0; j < channelData.length; j++, sampleOffset += (numOfChan * 2)) {
      let sample = Math.max(-1, Math.min(1, channelData[j]));
      // Convert to 16 bit PCM
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(sampleOffset, sample, true);
    }
  }
  
  return buffer;
}

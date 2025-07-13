// Audio conversion utilities
import lamejs from "lamejs";

// Convert WebM audio blob to MP3
export const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data as Float32Array
        const samples = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        // Convert float samples to 16-bit PCM
        const buffer = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          buffer[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff;
        }

        // Initialize MP3 encoder
        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // mono, sampleRate, 128kbps

        // Encode to MP3
        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152; // MP3 frame size

        for (let i = 0; i < buffer.length; i += sampleBlockSize) {
          const sampleChunk = buffer.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }

        // Flush remaining data
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        // Create blob from MP3 data
        const mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
        resolve(mp3Blob);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsArrayBuffer(audioBlob);
  });
};

// Get file extension based on MIME type
export const getFileExtension = (mimeType: string): string => {
  if (mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "audio";
};

// Get human-readable format name
export const getFormatName = (mimeType: string): string => {
  if (mimeType.includes("mp3")) return "MP3";
  if (mimeType.includes("webm")) return "WebM";
  if (mimeType.includes("mp4")) return "MP4";
  if (mimeType.includes("wav")) return "WAV";
  return "Audio";
};

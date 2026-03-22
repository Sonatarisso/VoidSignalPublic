// cameraEngine.ts - Handles all WebRTC / Webcam logic for VANTAGE CORP Meta-Horror

let videoElement: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// The dimensions we want to capture at
const WIDTH = 640;
const HEIGHT = 480;

/**
 * Initializes the camera stream silently.
 * Should only be called after explicit user consent.
 */
export const initCamera = async (): Promise<boolean> => {
  if (stream) return true; // Already initialized

  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: WIDTH, height: HEIGHT }, 
      audio: true 
    });

    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.muted = true; // MUST mute to prevent live feedback loop
    videoElement.play();

    canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext('2d');

    // Setup Audio Recording Buffer (Rolling 3 seconds)
    audioChunks = [];
    try {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
          // Keep only the last 3 seconds
          if (audioChunks.length > 3) {
            audioChunks.shift();
          }
        }
      };
      mediaRecorder.start(1000);
    } catch(e) {
      console.warn("MediaRecorder not supported or failed to start.", e);
    }

    return true;
  } catch (err) {
    console.error("VANTAGE CORP BIOMETRIC FAILURE:", err);
    return false;
  }
};

/**
 * Captures a frame from the webcam, applies a harsh green CRT contrast filter,
 * and returns it as a Base64 JPEG data URL.
 */
export const captureGlitchFrame = (): string | null => {
  if (!videoElement || !canvas || !ctx) return null;

  // Draw the current video frame to the canvas
  ctx.drawImage(videoElement, 0, 0, WIDTH, HEIGHT);

  // Get raw pixel data
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = imageData.data;

  // Apply harsh CRT Glitch / Green overlay filter
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // High contrast grayscale math
    let luma = (r * 0.299 + g * 0.587 + b * 0.114);
    
    // Crush blacks and peak whites
    if (luma < 80) luma = 0;
    else if (luma > 180) luma = 255;
    else luma = (luma - 80) * (255 / 100); 

    // Add digital noise/static
    const noise = (Math.random() - 0.5) * 50;
    
    // Scanline effect (darken every 3rd row)
    const row = Math.floor((i / 4) / WIDTH);
    const scanlineMultiplier = row % 3 === 0 ? 0.5 : 1.0;

    // Apply strict green phosphor color palette
    data[i] = 0; // Red
    data[i + 1] = Math.min(255, Math.max(0, (luma + noise) * scanlineMultiplier)); // Green (the only visible channel)
    data[i + 2] = 0; // Blue
  }

  // Put the altered pixels back
  ctx.putImageData(imageData, 0, 0);

  // Add a fake VANTAGE CORP overlay watermark via canvas drawing
  ctx.fillStyle = "rgba(0, 255, 65, 0.7)";
  ctx.font = "20px monospace";
  ctx.fillText("VANTAGE CORP // CLASS 4 ANOMALY DETECTED", 20, 30);
  ctx.fillText("BIOMETRIC TRACE LOGGED", 20, 60);

  // Random pixel shifting (glitch artifacting)
  for (let j = 0; j < 5; j++) {
    const sliceY = Math.random() * HEIGHT;
    const sliceH = Math.random() * 50;
    const shiftX = (Math.random() - 0.5) * 40;
    try {
      const sliceData = ctx.getImageData(0, sliceY, WIDTH, sliceH);
      ctx.putImageData(sliceData, shiftX, sliceY + (Math.random() - 0.5) * 10);
    } catch(e) { /* ignore bounds errors */ }
  }

  // Return base64 webp string for easy transport
  return canvas.toDataURL('image/jpeg', 0.6); // 60% quality jpeg shrinks the payload size for Socket.io
};

/**
 * Captures the buffered 3 seconds of microphone audio
 * and encodes it as a Base64 string for transport.
 */
export const captureAudioChunk = async (): Promise<string | null> => {
  if (audioChunks.length === 0) return null;

  const blob = new Blob(audioChunks); 
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
};

/**
 * Cleanup function to release the camera when the user disconnects or the component unmounts.
 */
export const stopCamera = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  mediaRecorder = null;
  audioChunks = [];

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (videoElement) {
    videoElement.removeAttribute('src');
    videoElement.load();
    videoElement = null;
  }
};

import React from "react";

const BASE_COLOR = [9, 9, 11] as const;
const PALETTE = [
  { color: [124, 58, 237] as const, alpha: 0.52, threshold: 0.18, softness: 0.22 },
  { color: [109, 40, 217] as const, alpha: 0.46, threshold: 0.08, softness: 0.24 },
  { color: [76, 29, 149] as const, alpha: 0.38, threshold: -0.02, softness: 0.26 },
  { color: [88, 28, 135] as const, alpha: 0.34, threshold: -0.12, softness: 0.28 }
];

function fade(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hash(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function gradient(ix: number, iy: number, x: number, y: number) {
  const angle = hash(ix, iy) * Math.PI * 2;
  const gx = Math.cos(angle);
  const gy = Math.sin(angle);
  return gx * (x - ix) + gy * (y - iy);
}

function perlin2(x: number, y: number) {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;

  const sx = fade(x - x0);
  const sy = fade(y - y0);

  const n0 = gradient(x0, y0, x, y);
  const n1 = gradient(x1, y0, x, y);
  const ix0 = lerp(n0, n1, sx);

  const n2 = gradient(x0, y1, x, y);
  const n3 = gradient(x1, y1, x, y);
  const ix1 = lerp(n2, n3, sx);

  return lerp(ix0, ix1, sy);
}

function fractalNoise(x: number, y: number, time: number) {
  let amplitude = 0.5;
  let frequency = 1;
  let sum = 0;
  let totalAmplitude = 0;

  for (let octave = 0; octave < 2; octave += 1) {
    const driftX = time * 0.08 * frequency;
    const driftY = time * 0.05 * frequency;
    sum += amplitude * perlin2(x * frequency + driftX, y * frequency + driftY);
    totalAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return sum / totalAmplitude;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function PlasmaBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return;
    }

    let frameId = 0;
    let lastFrameTime = 0;
    let width = 0;
    let height = 0;
    let imageData: ImageData | null = null;
    let pixels: Uint8ClampedArray | null = null;
    const targetFrameInterval = 1000 / 10;

    const resize = () => {
      width = Math.max(1, Math.floor(window.innerWidth / 8));
      height = Math.max(1, Math.floor(window.innerHeight / 8));
      canvas.width = width;
      canvas.height = height;
      imageData = context.createImageData(width, height);
      pixels = imageData.data;
    };

    const render = (timestamp: number) => {
      if (!imageData || !pixels) {
        return;
      }

      if (timestamp - lastFrameTime < targetFrameInterval) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      lastFrameTime = timestamp;
      const time = timestamp * 0.00018;
      let index = 0;

      for (let y = 0; y < height; y += 1) {
        const ny = y / height - 0.5;

        for (let x = 0; x < width; x += 1) {
          const nx = x / width - 0.5;
          const distance = Math.sqrt(nx * nx + ny * ny);

          const primary = fractalNoise(nx * 2.2 + 12.7, ny * 2.2 - 3.1, time);
          const secondary = perlin2(nx * 4.2 - 8.3 + time * 0.35, ny * 4.2 + 5.4 - time * 0.28);
          const combined = primary * 0.72 + secondary * 0.28;
          const glow = Math.max(0, 1 - distance * 1.85);

          let red = BASE_COLOR[0];
          let green = BASE_COLOR[1];
          let blue = BASE_COLOR[2];

          for (const layer of PALETTE) {
            const intensity = smoothstep(layer.threshold, layer.threshold + layer.softness, combined) * glow;
            const alpha = intensity * layer.alpha;
            red += (layer.color[0] - red) * alpha;
            green += (layer.color[1] - green) * alpha;
            blue += (layer.color[2] - blue) * alpha;
          }

          pixels[index] = Math.max(0, Math.min(255, Math.round(red)));
          pixels[index + 1] = Math.max(0, Math.min(255, Math.round(green)));
          pixels[index + 2] = Math.max(0, Math.min(255, Math.round(blue)));
          pixels[index + 3] = 255;
          index += 4;
        }
      }

      context.putImageData(imageData, 0, 0);
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#09090b]">
      <canvas
        ref={canvasRef}
        className="h-full w-full pointer-events-none"
        style={{ imageRendering: "auto", transform: "translateZ(0)", willChange: "transform" }}
      />
    </div>
  );
}
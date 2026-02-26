import { useRef, useEffect, useState } from "react";

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
  threshold?: number;
}

export function TransparentLogo({ src, alt, className = "", threshold = 230 }: TransparentLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setLoaded(true);
    };
    img.src = src;
  }, [src, threshold]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      role="img"
      aria-label={alt}
    />
  );
}

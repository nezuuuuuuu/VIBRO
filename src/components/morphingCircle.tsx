import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { spline } from "@georgedoescode/spline";
import {
  Canvas,
  Path,
  LinearGradient,
  Text as SkiaText,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { createNoise2D } from "simplex-noise";

// Load a font (add your font in assets)
const FONT = require("../assets/fonts/Poppins-Medium.ttf");

// Create points around a circle for morphing
function createPoints(center: number, radius: number, numPoints = 12) {
  const points = [];
  const angleStep = (Math.PI * 2) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const theta = i * angleStep;
    const x = center + Math.cos(theta) * radius;
    const y = center + Math.sin(theta) * radius;

    points.push({
      x,
      y,
      originX: x,
      originY: y,
      noiseOffsetX: Math.random() * 1000,
      noiseOffsetY: Math.random() * 1000,
    });
  }

  return points;
}

// Utility map function
const map = (n: number, a1: number, a2: number, b1: number, b2: number) =>
  ((n - a1) / (a2 - a1)) * (b2 - b1) + b1;

interface MorphingCircleProps {
  size?: number;
  colors?: string[];
  text?: string;
  textColor?: string;
  textSize?: number;
}

export default function MorphingCircle({
  size = 275,
  colors = ["green", "yellow"],
  text = "Hello",
  textColor = "white",
  textSize = 32,
}: MorphingCircleProps) {
  const font = useFont(FONT, textSize);

  const noise = useRef(createNoise2D()).current;
  const noiseStep = 0.005;

  const radius = size * 0.4;
  const center = size * 0.5;

  const [path, setPath] = useState("");
  const pointsRef = useRef(createPoints(center, radius));

  // Recreate points if size changes
  useEffect(() => {
    pointsRef.current = createPoints(center, radius);
  }, [size]);

  const animate = () => {
    const pts = pointsRef.current;
    const jitter = radius * 0.1; // 10% of radius for smooth morphing

    for (let p of pts) {
      const nX = noise(p.noiseOffsetX, p.noiseOffsetX);
      const nY = noise(p.noiseOffsetY, p.noiseOffsetY);

      p.x = map(nX, -1, 1, p.originX - jitter, p.originX + jitter);
      p.y = map(nY, -1, 1, p.originY - jitter, p.originY + jitter);

      p.noiseOffsetX += noiseStep;
      p.noiseOffsetY += noiseStep;
    }

    setPath(spline(pts, 1, true));
  };

  useEffect(() => {
    let frame: number;
    const loop = () => {
      animate();
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [noise, noiseStep]);

  const textX = center - (font ? font.getTextWidth(text) / 2 : 0);
  const textY = center + textSize / 3;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        {path && (
          <Path path={path}>
            <LinearGradient start={vec(0, 0)} end={vec(size, size)} colors={colors} />
          </Path>
        )}

        {font && (
          <SkiaText
            text={text}
            x={textX}
            y={textY}
            color={textColor}
            font={font}
          />
        )}
      </Canvas>
    </View>
  );
}

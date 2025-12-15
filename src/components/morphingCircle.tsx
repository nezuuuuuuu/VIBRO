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
  Image as SkiaImage,
  useImage,
  Group,
  Shadow,

} from "@shopify/react-native-skia";
import { createNoise2D } from "simplex-noise";

// Load a font (add your font in assets)
const FONT = require("../assets/fonts/Poppins-Medium.ttf");
// const BABY_CRYING = require("../assets/images/ic_launcher.png");
const SOUND_PNG = require("../assets/images/labels_image/sound.png");


const imgSize = 50;
const gap = 6;
const SOUND_ICONS: { [key: string]: any } = {
  'Speech': require('../assets/images/labels_image/human_speech.png'),
  'Crying, sobbing': require('../assets/images/labels_image/baby_crying.png'),
  'Emergency vehicle': require('../assets/images/labels_image/siren.png'),
  'Music': require('../assets/images/labels_image/music.png'),
  'Fire alarm': require('../assets/images/labels_image/fire_alarm2.png'),
  'Glass': require('../assets/images/labels_image/broken_glass.png'),

};

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
  textSize = 48,
}: MorphingCircleProps) {
  const image = useImage(SOUND_ICONS[text] || SOUND_PNG);

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
  const textHeight = font?.getSize() ?? 0;
  

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        {path && (
          <Path path={path}>
            <LinearGradient start={vec(0, 0)} end={vec(size, size)} colors={colors} />
            <Shadow dx={0} dy={4} blur={10} color="rgba(0,0,0,0.3)" />
          </Path>
        )}
        
         {image && font && (
  <Group>
    {/*
      Total height of stacked content:
      image + gap + text
    */}
    <SkiaImage
      image={image}
      x={(size - imgSize) / 2}
      y={(size - (imgSize + gap + textHeight)) / 2}
      width={imgSize}
      height={imgSize}
      fit="contain">

      <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.2)" />
    </SkiaImage>

    <SkiaText
      text={text}
      x={textX}
      y={(size - (imgSize + gap + textHeight)) / 2 + imgSize + gap + textHeight}
      color={textColor}
      font={font}
      letterSpacing={-0.5}

    >
      {/* --- NEW: Shadow added here --- */}
      <Shadow 
        dx={0}     // Horizontal offset
        dy={2}     // Vertical offset (downwards)
        blur={4}   // How soft the shadow is
        color="rgba(0,0,0,0.5)" // Usually darker than the text color
      />
    </SkiaText>
  </Group>
)}
      </Canvas>
    </View>
  );
}

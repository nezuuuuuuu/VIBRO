import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

// @ts-ignore
import { spline } from "@georgedoescode/spline";

import {
  Canvas,
  Path,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";

import { createNoise2D } from "simplex-noise";

function createPoints() {
  const points = [];
  const numPoints = 6;
  const angleStep = (Math.PI * 2) / numPoints;
  const radius = 110;

  for (let i = 1; i <= numPoints; i++) {
    const theta = i * angleStep;
    const x = 130 + Math.cos(theta) * radius;
    const y = 130 + Math.sin(theta) * radius;

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

const map = (n, a1, a2, b1, b2) =>
  ((n - a1) / (a2 - a1)) * (b2 - b1) + b1;

export default function MorphingCircle() {
  const noise = useRef(createNoise2D()).current;
  const noiseStep = 0.005;

  const [path, setPath] = useState("");
  const pointsRef = useRef(createPoints());

  const animate = () => {
    const pts = pointsRef.current;

    for (let p of pts) {
      const nX = noise(p.noiseOffsetX, p.noiseOffsetX);
      const nY = noise(p.noiseOffsetY, p.noiseOffsetY);

      p.x = map(nX, -1, 1, p.originX - 20, p.originX + 20);
      p.y = map(nY, -1, 1, p.originY - 20, p.originY + 20);

      p.noiseOffsetX += noiseStep;
      p.noiseOffsetY += noiseStep;
    }

    const newPath = spline(pts, 1, true);
    setPath(newPath);
  };

  useEffect(() => {
    let frame;
    const loop = () => {
      animate();
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Canvas style={styles.canvas}>
        <Path path={path}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(256, 256)}
            colors={["green", "yellow"]}
          />
        </Path>
      </Canvas>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  canvas: {
    width: 275,
    height: 275,
  },
});

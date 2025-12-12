import { Dimensions, View, Text } from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import MorphingCircle from './morphingCircle';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MIN_SIZE = 100;
const MAX_SIZE = 200;
const TIME_WINDOW_MS = 1 * 60 * 1000; // 1 minutes

const GRADIENT_COLOR: { [key: number]: [string, string] } = {
  1: ['#FECACA', '#F87171'],
  2: ['#FEF08A', '#FCD34D'],
  3: ['#BAE6FD', '#7DD3FC'],
  4: ['#B57EDC', '#8A2BE2'],
};

// SAFE MAP (NO DIVISION BY ZERO → NO NaN)
const map = (value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) => {
  if (fromHigh === fromLow) return toLow;
  return ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow) + toLow;
};

const generateRandomPosition = (
  size: number,
  existingPositions: { x: number; y: number; size: number }[]
) => {
  let tries = 0;
  let x = 0;
  let y = 0;
  const maxTries = 200;

  const collides = (x: number, y: number, size: number) =>
    existingPositions.some((pos) => {
      const dx = pos.x + pos.size / 2 - (x + size / 2);
      const dy = pos.y + pos.size / 2 - (y + size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (size + pos.size) / 2;
    });

  do {
    x = Math.random() * (screenWidth - size);
    y = Math.random() * (screenHeight - size - 150);
    tries++;
  } while (collides(x, y, size) && tries < maxTries);

  return { x, y };
};

export default function PredictedCircles({ predictions }) {
  const now = Date.now();

  // 1. SAFELY FILTER PREDICTIONS
  const recentPredictions = predictions.filter(
    (p) => p && p.label && p.timestamp && now - p.timestamp <= TIME_WINDOW_MS
  );

  // 2. GROUP BY LABEL
  const grouped: { [key: string]: any[] } = {};
  recentPredictions.forEach((p) => {
    if (!grouped[p.label]) grouped[p.label] = [];
    grouped[p.label].push(p);
  });

  const currentLabels = Object.keys(grouped);
  const maxCount = Math.max(...Object.values(grouped).map((arr) => arr.length), 1);
  const computeSize = (count: number) => {
    return Math.min(MIN_SIZE + (count - 1) * 20, MAX_SIZE);
  };

  // 3. STATE FOR POSITIONS
  const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});

  // 4. ASSIGN POSITIONS SAFELY
  useEffect(() => {
    setPositions((currentPositions) => {
      const newPositions = { ...currentPositions };
      let changed = false;

      currentLabels.forEach((label) => {
        if (!newPositions[label]) {
          const size = map(grouped[label].length, 1, maxCount, MIN_SIZE, MAX_SIZE);

          const existing = Object.entries(newPositions).map(([key, p]) => {
            const count = grouped[key]?.length ?? 1;
            return {
              ...p,
              size: map(count, 1, maxCount, MIN_SIZE, MAX_SIZE),
            };
          });

          newPositions[label] = generateRandomPosition(size, existing);
          changed = true;
        }
      });

      Object.keys(newPositions).forEach((label) => {
        if (!currentLabels.includes(label)) {
          delete newPositions[label];
          changed = true;
        }
      });

      return changed ? newPositions : currentPositions;
    });
  }, [JSON.stringify(currentLabels), maxCount, grouped]);

  // 5. DO NOT RENDER UNTIL ALL POSITIONS EXIST
  const allReady = currentLabels.every((label) => positions[label]);
  if (!allReady) {
    return <View style={{ flex: 1, backgroundColor: '#1B1B3A' }} />;
  }

  // 6. RENDER
  return (
    <View style={{ flex: 1, backgroundColor: '#1B1B3A' }}>
      {currentLabels.map((label) => {
        const arr = grouped[label];
        const size = computeSize(arr.length);

        const pos = positions[label];
        const criticalLevel = arr[0]?.criticalLevel ?? 1;
        const colors = GRADIENT_COLOR[criticalLevel] ?? ['#FECACA', '#F87171'];

        const { x, y } = pos;
        console.log(`Rendering circle for "${label}" at (${x.toFixed(1)}, ${y.toFixed(1)}) with size ${size.toFixed(1)}`);

        return (
          <View
            key={label}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
            }}
          >
            <MorphingCircle
              size={size}
              colors={colors}
              text={label}
              textColor="#fff"
              textSize={Math.min(40, size / 15)}
            />
          </View>
        );
      })}
    </View>
  );
}

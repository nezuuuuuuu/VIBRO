import { Dimensions, View, Text } from 'react-native'; // Added Text for safety, though not strictly needed here
import { useMemo, useState, useEffect } from 'react';
import MorphingCircle from './morphingCircle';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 💡 MISSING CONSTANTS RE-ADDED HERE
const MIN_SIZE = 50;
const MAX_SIZE = 150;
const TIME_WINDOW_MS = 3 * 60 * 1000; // 3 minutes in ms
const GRADIENT_COLOR: { [key: number]: [string, string] } = {
  1: ['#FECACA', '#F87171'], // soft rose -> deep rose
  2: ['#FEF08A', '#FCD34D'], // light yellow -> rich yellow
  3: ['#BAE6FD', '#7DD3FC'], // pale sky blue -> vibrant sky blue
  4: ['#B57EDC', '#8A2BE2'], // light purple -> deep purple
};
const map = (value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) =>
  ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow) + toLow;
const generateRandomPosition = (size: number, existingPositions: { x: number; y: number; size: number }[]) => {
  let tries = 0;
  let x = 0;
  let y = 0;
  const maxTries = 200; // was 50

  const collides = (x: number, y: number, size: number) =>
    existingPositions.some(pos => {
      const dx = pos.x + pos.size / 2 - (x + size / 2);
      const dy = pos.y + pos.size / 2 - (y + size / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (size + pos.size) / 2; // simple circle collision
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

  // 1. Filter and Group Predictions
  const recentPredictions = predictions.filter(
    (p) => now - p.timestamp <= TIME_WINDOW_MS
  );

  const grouped: { [key: string]: any[] } = {};
  recentPredictions.forEach((p) => {
    if (!grouped[p.label]) grouped[p.label] = [];
    grouped[p.label].push(p);
  });

  const currentLabels = Object.keys(grouped);
  const maxCount = Math.max(...Object.values(grouped).map((arr) => arr.length), 1);

  // 2. Use useState to store and stabilize positions
  const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});

  // 3. Use useEffect to manage position state when labels change
  useEffect(() => {
    setPositions(currentPositions => {
      const newPositions = { ...currentPositions };
      let changed = false;
      
      // A. Check for new labels and assign a position
      currentLabels.forEach(label => {
  if (!newPositions[label]) {
    const size = map(grouped[label].length, 1, maxCount, MIN_SIZE, MAX_SIZE);
    const existing = Object.values(newPositions).map((p, i) => ({
      ...p,
      size: map(grouped[Object.keys(newPositions)[i]].length, 1, maxCount, MIN_SIZE, MAX_SIZE)
    }));
    newPositions[label] = generateRandomPosition(size, existing);
    changed = true;
  }
});

      // B. Remove positions for labels that are no longer present
      Object.keys(newPositions).forEach(label => {
        if (!currentLabels.includes(label)) {
          delete newPositions[label];
          changed = true;
        }
      });
      
      // C. Update state only if changes were made
      if (changed) {
           return newPositions;
      }
      return currentPositions;
    });
  // Dependency: only re-run when the set of labels or the max count changes.
  // Using JSON.stringify ensures we compare the labels array by value, not reference.
  }, [JSON.stringify(currentLabels), maxCount, grouped]);


  // 4. Render using the stable `positions` state
  return (
    <View style={{ flex: 1, backgroundColor: '#1B1B3A' }}>
      {currentLabels.map((label) => {
        const arr = grouped[label];
        const size = map(arr.length, 1, maxCount, MIN_SIZE, MAX_SIZE);
        const pos = positions[label] ?? { x: 50, y: 50 };
        const criticalLevel = arr[0]?.criticalLevel ?? 1; // default to 1
        const colors = GRADIENT_COLOR[criticalLevel] ?? ['#FECACA', '#F87171'];

        if (!pos) return null; 
        const { x, y } = pos; 

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
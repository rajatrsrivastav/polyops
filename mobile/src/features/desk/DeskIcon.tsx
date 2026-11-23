import { View } from 'react-native';

type Point = [number, number];
const drawings = {
  desk: [[[3, 12], [12, 4], [21, 12]], [[5, 10], [5, 21], [19, 21], [19, 10]], [[10, 21], [10, 15], [14, 15], [14, 21]]],
  stock: [[[3, 8], [12, 3], [21, 8], [21, 17], [12, 22], [3, 17], [3, 8], [12, 13], [21, 8]], [[12, 13], [12, 22]], [[8, 6], [16, 11]]],
  dispatch: [[[3, 6], [14, 6], [14, 17], [3, 17], [3, 6]], [[14, 9], [18, 9], [21, 13], [21, 17], [14, 17]]],
  receive: [[[12, 3], [12, 14]], [[7, 9], [12, 14], [17, 9]], [[3, 15], [3, 21], [21, 21], [21, 15]]],
  plus: [[[12, 5], [12, 19]], [[5, 12], [19, 12]]],
  report: [[[4, 4], [4, 20], [21, 20]], [[8, 16], [8, 12]], [[13, 16], [13, 8]], [[18, 16], [18, 5]]],
  more: [[[4, 6], [20, 6]], [[4, 12], [20, 12]], [[4, 18], [20, 18]]],
  search: [[[15, 15], [21, 21]]],
  chevron: [[[9, 6], [15, 12], [9, 18]]],
  close: [[[6, 6], [18, 18]], [[18, 6], [6, 18]]],
} satisfies Record<string, Point[][]>;

export type DeskIconName = keyof typeof drawings;

export function DeskIcon({ name, color, size = 22 }: { name: DeskIconName; color: string; size?: number }) {
  const scale = size / 24;
  const circles: [number, number, number][] = name === 'search'
    ? [[3, 3, 14]]
    : name === 'dispatch' ? [[5, 16, 5], [15, 16, 5]] : [];
  return (
    <View pointerEvents="none" accessible={false} style={{ width: size, height: size }}>
      {drawings[name].flatMap((path, pathIndex) =>
        path.slice(1).map(([x, y], index) => {
          const start = path[index];
          if (!start) return null;
          const [ax, ay] = start;
          const length = Math.hypot(x - ax, y - ay);
          return (
            <View key={`${pathIndex}-${index}`} style={{
              position: 'absolute',
              width: (length + 1.45) * scale,
              height: 1.65 * scale,
              left: ((x + ax - length - 1.45) / 2) * scale,
              top: ((y + ay - 1.65) / 2) * scale,
              borderRadius: scale,
              backgroundColor: color,
              transform: [{ rotate: `${Math.atan2(y - ay, x - ax)}rad` }],
            }} />
          );
        }),
      )}
      {circles.map(([x, y, diameter]) => (
        <View key={x} style={{
          position: 'absolute',
          left: x * scale,
          top: y * scale,
          width: diameter * scale,
          height: diameter * scale,
          borderRadius: diameter * scale / 2,
          borderWidth: 1.65 * scale,
          borderColor: color,
        }} />
      ))}
    </View>
  );
}

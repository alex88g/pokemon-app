// src/shims/useFrameSize.ts
import { useWindowDimensions } from 'react-native';

export default function useFrameSize() {
  const { width, height } = useWindowDimensions();
  return { width, height };
}

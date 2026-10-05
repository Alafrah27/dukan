import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

/**
 * Auto-advancing carousel logic for a horizontal paged FlatList.
 * - Pauses while the user drags and while the screen is not focused.
 * - Tracks the active index via viewability (works in both LTR & RTL).
 */
export default function useAutoSlide({ itemCount, interval = 4000 }) {
  const listRef = useRef(null);
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateIndex = useCallback((index) => {
    indexRef.current = index;
    setActiveIndex(index);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (itemCount < 2) return;

    timerRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % itemCount;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      updateIndex(next);
    }, interval);
  }, [itemCount, interval, stop, updateIndex]);

  // Reset when the data size changes (e.g. after refetch)
  useEffect(() => {
    if (indexRef.current >= itemCount) updateIndex(0);
  }, [itemCount, updateIndex]);

  // Only run while the screen is focused
  useFocusEffect(
    useCallback(() => {
      start();
      return stop;
    }, [start, stop])
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const first = viewableItems?.[0];
    if (first?.index != null) {
      indexRef.current = first.index;
      setActiveIndex(first.index);
    }
  }).current;

  return {
    listRef,
    activeIndex,
    listProps: {
      onScrollBeginDrag: stop,
      onScrollEndDrag: start,
      onViewableItemsChanged,
      viewabilityConfig: VIEWABILITY_CONFIG,
    },
  };
}

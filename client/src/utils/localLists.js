// Lists saved in this browser only (no account needed):
// recently viewed properties and the compare list.
import { useEffect, useState } from "react";

const RECENT_KEY = "recentlyViewed";
const COMPARE_KEY = "compareList";
export const MAX_COMPARE = 3;

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const write = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage full or blocked – not important
  }
  window.dispatchEvent(new Event(`${key}-changed`));
};

// Recently viewed: newest first, max 8
export const getRecentlyViewed = () => read(RECENT_KEY);
export const addRecentlyViewed = (id) =>
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, 8));

// Compare list: max 3 property ids
export const getCompareList = () => read(COMPARE_KEY);
export const clearCompareList = () => write(COMPARE_KEY, []);
export const toggleCompare = (id) => {
  const list = read(COMPARE_KEY);
  if (list.includes(id)) {
    write(COMPARE_KEY, list.filter((x) => x !== id));
    return true;
  }
  if (list.length >= MAX_COMPARE) return false; // full
  write(COMPARE_KEY, [...list, id]);
  return true;
};

// React hook that re-renders when the compare list changes anywhere on the page
export function useCompareList() {
  const [list, setList] = useState(getCompareList);
  useEffect(() => {
    const update = () => setList(getCompareList());
    window.addEventListener(`${COMPARE_KEY}-changed`, update);
    return () => window.removeEventListener(`${COMPARE_KEY}-changed`, update);
  }, []);
  return list;
}

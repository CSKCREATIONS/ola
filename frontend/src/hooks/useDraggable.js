import { useEffect } from 'react';

// Lightweight hook to make an element draggable by a handle selector (or the element itself)
// Usage: pass a ref to the draggable element and an options object { handleSelector }
export default function useDraggable(ref, options = {}) {
  useEffect(() => {
    const el = ref && ref.current;
    if (!el) return;

    const { handleSelector } = options;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // apply new position
      el.style.top = (el.offsetTop - pos2) + 'px';
      el.style.left = (el.offsetLeft - pos1) + 'px';
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    // find the handle inside the element; if none provided, use the element itself
    let handle = null;
    try {
      handle = handleSelector ? el.querySelector(handleSelector) : el;
    } catch (err) {
      // if selector invalid, fallback to element
      handle = el;
    }

    if (handle) handle.onmousedown = dragMouseDown;

    return () => {
      if (handle) handle.onmousedown = null;
      document.onmouseup = null;
      document.onmousemove = null;
    };
  }, [ref, options]);
}

"use client";

import { useEffect } from "react";

export function ScrollRestoration() {
  useEffect(() => {
    if (window.location.hash) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  return null;
}

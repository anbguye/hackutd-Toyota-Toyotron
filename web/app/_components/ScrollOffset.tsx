"use client";

import { useEffect } from "react";

export default function ScrollOffset() {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>("[data-sticky-header]");
    const update = () => {
      const h = header?.offsetHeight ?? 80;
      root.style.setProperty("--header-h", `${h}px`);
      root.style.setProperty("scroll-padding-top", `${h}px`);
      document.body.style.setProperty("--header-h", `${h}px`);
      document.body.style.removeProperty("padding-top");
    };
    update();
    const ro = new ResizeObserver(update);
    if (header) ro.observe(header);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return null;
}


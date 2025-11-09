"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-h")
    ) || 80;
  const top = window.scrollY + el.getBoundingClientRect().top - headerH;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function HashAnchorFix() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => scrollToId(id));
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest<HTMLAnchorElement>("a[href*='#']");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const url = href.startsWith("#") ? new URL(`${location.pathname}${location.search}${href}`, location.origin) : new URL(a.href);
      if (url.origin !== location.origin) return;
      if (url.pathname !== location.pathname) return;
      const id = url.hash.slice(1);
      if (!id) return;
      e.preventDefault();
      history.pushState(null, "", `${url.pathname}${url.search}#${id}`);
      scrollToId(id);
    };
    document.addEventListener("click", onClick);

    const onHash = () => {
      const id = location.hash.slice(1);
      if (id) scrollToId(id);
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, [pathname, search]);

  return null;
}


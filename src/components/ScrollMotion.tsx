"use client";

import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    // 0. Always land on top on refresh (unless deep-linked with #hash)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      // override late browser restore / image-shift jumps
      requestAnimationFrame(() => window.scrollTo(0, 0));
      const t1 = window.setTimeout(() => window.scrollTo(0, 0), 120);
      const t2 = window.setTimeout(() => window.scrollTo(0, 0), 500);
      var cleanupTimers = () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Scroll reveals + stagger
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const showAll = () => {
      els.forEach((el) => el.classList.add("in"));
      document.querySelectorAll(".reveal-child").forEach((c) => c.classList.add("in"));
    };
    let childObserver: IntersectionObserver | null = null;
    if (reduced || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("in");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach((el) => io.observe(el));
      document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((parent) => {
        Array.from(parent.children).forEach((child, i) => {
          const c = child as HTMLElement;
          if (!c.classList.contains("reveal-child")) {
            c.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
            c.classList.add("reveal-child");
          }
        });
      });
      childObserver = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("in");
              childObserver?.unobserve(e.target);
            }
          }
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll(".reveal-child").forEach((c) => childObserver?.observe(c));
    }

    // 2. Word-split rise for hero + section headings
    if (!reduced) {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        if (el.dataset.splitDone) return;
        el.dataset.splitDone = "1";
        const walk = (node: Node) => {
          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType === 3) {
              const frag = document.createDocumentFragment();
              (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                  frag.appendChild(document.createTextNode(" "));
                } else {
                  const w = document.createElement("span");
                  w.className = "w-word";
                  const inner = document.createElement("span");
                  inner.className = "w-inner";
                  inner.textContent = part;
                  w.appendChild(inner);
                  frag.appendChild(w);
                }
              });
              node.replaceChild(frag, child);
            } else if (child.nodeType === 1) {
              walk(child);
            }
          });
        };
        walk(el);
        el.classList.add("split-ready");
        const rio = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                el.classList.add("split-in");
                rio.disconnect();
              }
            });
          },
          { threshold: 0.3 }
        );
        rio.observe(el);
      });
    }

    // 3. Count-up stats
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      if (el.dataset.countDone) return;
      el.dataset.countDone = "1";
      const target = parseFloat(el.dataset.count || "0");
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const suffix = el.dataset.suffix || "";
      const render = (v: number) => {
        el.textContent = `${v.toFixed(decimals)}${suffix}`;
      };
      if (reduced) {
        render(target);
        return;
      }
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            cio.disconnect();
            const t0 = performance.now();
            const dur = 1400;
            const tick = (t: number) => {
              const p = Math.min((t - t0) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 4);
              render(target * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.5 }
      );
      cio.observe(el);
    });

    // 4. Header + progress + parallax orbs + preview drift
    const header = document.querySelector(".site-header");
    const progress = document.querySelector<HTMLElement>(".scroll-progress i");
    const preview = document.querySelector<HTMLElement>(".preview");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        header?.classList.toggle("scrolled", y > 8);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress && max > 0) progress.style.width = `${(y / max) * 100}%`;
        if (preview && !reduced && y < window.innerHeight * 1.2) {
          preview.style.setProperty("--float", `${y * 0.05}px`);
        }
        document.documentElement.style.setProperty("--sy", `${y}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // 5. Spotlight cards (mouse-tracked glow)
    if (!reduced && window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-spot]").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${e.clientX - r.left}px`);
          card.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      });

      // 6. 3D tilt on preview
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        let frame = 0;
        el.addEventListener("pointermove", (e) => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = `perspective(1100px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(var(--float, 0px))`;
          });
        });
        el.addEventListener("pointerleave", () => {
          cancelAnimationFrame(frame);
          el.style.transform = "";
        });
      });

      // 7. Magnetic buttons
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
        btn.addEventListener("pointermove", (e) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          btn.style.transform = `translate(${(dx * 0.12).toFixed(1)}px, ${(dy * 0.18).toFixed(1)}px)`;
        });
        btn.addEventListener("pointerleave", () => {
          btn.style.transform = "";
        });
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (typeof cleanupTimers !== "undefined") cleanupTimers();
    };
  }, []);

  return null;
}

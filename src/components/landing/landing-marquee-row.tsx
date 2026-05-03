"use client";

import { useEffect, useRef } from "react";

type MarqueeRowProps = {
  items: { id: string; src: string }[];
  direction: "left" | "right";
  speed: number;
};

export function LandingMarqueeRow({ items, direction, speed }: MarqueeRowProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  const loop = [
    ...items.map((item) => ({ ...item, key: `${item.id}-a` })),
    ...items.map((item) => ({ ...item, key: `${item.id}-b` })),
  ];

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let stripHalf = strip.scrollWidth / 2;
    let frame = 0;

    const apply = () => {
      frame = 0;
      if (stripHalf <= 0) return;
      const distance = (((window.scrollY * speed) % stripHalf) + stripHalf) % stripHalf;
      const x = direction === "left" ? -distance : distance - stripHalf;
      strip.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    const ro = new ResizeObserver(() => {
      stripHalf = strip.scrollWidth / 2;
      apply();
    });
    ro.observe(strip);

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [direction, speed]);

  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div ref={stripRef} className="marquee-strip flex w-max gap-4">
        {loop.map((item) => (
          <div
            key={item.key}
            className="h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 sm:h-32 sm:w-48 lg:h-36 lg:w-56"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

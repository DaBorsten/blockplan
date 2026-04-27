"use client";
import { TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

const PX_PER_SECOND = Number(process.env.NEXT_PUBLIC_NEWS_BANNER_SPEED) || 50;

export function NewsBanner() {
  const bannerText = process.env.NEXT_PUBLIC_NEWS_BANNER_TEXT;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !trackRef.current) return;

    const updateHeight = () => {
      const h = wrapperRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--news-banner-height", `${h}px`);
    };

    const updateSpeed = () => {
      const halfWidth = (trackRef.current?.scrollWidth ?? 0) / 2;
      const duration = halfWidth / PX_PER_SECOND;
      trackRef.current?.style.setProperty("animation-duration", `${duration}s`);
    };

    updateHeight();
    updateSpeed();

    const ro = new ResizeObserver(() => { updateHeight(); updateSpeed(); });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [bannerText]);

  if (!bannerText) return null;

  const item = (
    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap px-8">
      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
      <span>{bannerText}</span>
    </span>
  );

  const half = Array.from({ length: 8 }, (_, i) => <span key={i}>{item}</span>);

  return (
    <div ref={wrapperRef} className="w-full bg-yellow-400 text-yellow-900 py-1 text-sm font-medium overflow-hidden">
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 1s linear infinite;
        }
      `}</style>
      <div ref={trackRef} className="ticker-track">
        {half}
        {half}
      </div>
    </div>
  );
}

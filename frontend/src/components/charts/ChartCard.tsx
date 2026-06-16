"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { Maximize2, Minimize2, Download, RefreshCw, X, BarChart3, AlertCircle } from "lucide-react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRefresh?: () => void;
  actionButtons?: ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  loading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  error = null,
  onRefresh,
  actionButtons,
  className = "",
}: ChartCardProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [fsKey, setFsKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const exportSVG = useCallback(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title]);

  const exportPNG = useCallback(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  }, [title]);

  const openFullscreen = useCallback(() => {
    setFsKey((k) => k + 1);
    setFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
  }, []);

  const statusContent =
    loading ? (
      <div className="skeleton skeleton-chart-md w-full" />
    ) : error ? (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3">
        <AlertCircle className="w-8 h-8 text-risk-high/50" />
        <p className="text-sm text-risk-high text-center">{error}</p>
        {onRefresh && (
          <button className="btn-secondary btn-sm" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    ) : isEmpty ? (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3">
        <BarChart3 className="w-8 h-8 text-steel-500/50" />
        <p className="text-sm text-steel-500 text-center">{emptyMessage}</p>
      </div>
    ) : null;

  return (
    <>
      <div className={`chart-card ${className}`} ref={containerRef}>
        {/* Header */}
        <div className="chart-card-header">
          <div className="min-w-0">
            <h3 className="chart-card-title truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-steel-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <div className="chart-actions flex-shrink-0">
            {actionButtons}
            {onRefresh && (
              <button
                className="chart-action-btn"
                onClick={onRefresh}
                title="Refresh data"
                aria-label="Refresh chart"
              >
                <RefreshCw />
              </button>
            )}
            <button
              className="chart-action-btn"
              onClick={exportSVG}
              title="Export as SVG"
              aria-label="Export chart as SVG"
            >
              <Download />
            </button>
            <button
              className="chart-action-btn"
              onClick={openFullscreen}
              title="View fullscreen"
              aria-label="View chart fullscreen"
            >
              <Maximize2 />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="chart-card-body">
          {statusContent || children}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="chart-fullscreen-overlay"
          onClick={closeFullscreen}
          role="dialog"
          aria-label={`${title} fullscreen view`}
        >
          <div
            className="chart-fullscreen-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-steel-300 truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-steel-500 mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
              <div className="chart-actions flex-shrink-0 ml-4">
                <button
                  className="chart-action-btn"
                  onClick={exportPNG}
                  title="Export as PNG"
                  aria-label="Export chart as PNG"
                >
                  <Download />
                </button>
                <button
                  className="chart-action-btn"
                  onClick={closeFullscreen}
                  title="Close fullscreen"
                  aria-label="Close fullscreen view"
                >
                  <X />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0" key={fsKey}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

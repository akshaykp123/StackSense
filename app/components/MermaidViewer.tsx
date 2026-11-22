"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Check, Workflow } from "lucide-react";

interface MermaidViewerProps {
  chart: string;
  isDark?: boolean;
}

export default function MermaidViewer({ chart, isDark = true }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      themeVariables: isDark
        ? {
            darkMode: true,
            background: "transparent",
            primaryColor: "#16191E",
            primaryTextColor: "#ECEDEF",
            primaryBorderColor: "rgba(255, 255, 255, 0.12)",
            lineColor: "#6B7078",
            secondaryColor: "#111317",
            tertiaryColor: "#16191E",
          }
        : {
            darkMode: false,
            background: "transparent",
            primaryColor: "#FFFFFF",
            primaryTextColor: "#111318",
            primaryBorderColor: "rgba(0, 0, 0, 0.12)",
            lineColor: "#8A909E",
            secondaryColor: "#F3F4F6",
            tertiaryColor: "#FFFFFF",
          },
      fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    let isMounted = true;

    async function renderChart() {
      if (!chart || !containerRef.current) return;
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setRenderError("Failed to render diagram syntax.");
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, isDark]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] transition-colors duration-150">
      {/* Header bar */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-[var(--text-tertiary)] stroke-[1.5]" />
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            Topology Diagram
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
              <span>Copied Syntax</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Diagram Code</span>
            </>
          )}
        </button>
      </div>

      {/* Diagram Render Area */}
      <div ref={containerRef} className="flex min-h-[260px] items-center justify-center overflow-x-auto py-4">
        {renderError ? (
          <div className="text-[13px] text-[var(--danger)]">{renderError}</div>
        ) : svgContent ? (
          <div
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-[13px] text-[var(--text-tertiary)] animate-pulse">Rendering architectural topology...</div>
        )}
      </div>
    </div>
  );
}

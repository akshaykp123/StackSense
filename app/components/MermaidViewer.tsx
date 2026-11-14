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
    // Configure Mermaid with theme corresponding to dark/light mode
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      themeVariables: isDark
        ? {
            darkMode: true,
            background: "#09090b",
            primaryColor: "#18181b",
            primaryTextColor: "#fafafa",
            primaryBorderColor: "#3f3f46",
            lineColor: "#71717a",
            secondaryColor: "#27272a",
            tertiaryColor: "#18181b",
          }
        : {
            darkMode: false,
            background: "#ffffff",
            primaryColor: "#f4f4f5",
            primaryTextColor: "#09090b",
            primaryBorderColor: "#d4d4d8",
            lineColor: "#71717a",
            secondaryColor: "#e4e4e7",
            tertiaryColor: "#f4f4f5",
          },
      fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
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
    <div
      className={`rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-colors ${
        isDark
          ? "border-zinc-800 bg-zinc-900/40 text-zinc-100"
          : "border-zinc-200 bg-white text-zinc-900 shadow-sm"
      }`}
    >
      {/* Header bar */}
      <div
        className={`mb-3 flex items-center justify-between border-b pb-2.5 ${
          isDark ? "border-zinc-800" : "border-zinc-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <Workflow className={`h-3.5 w-3.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              isDark ? "text-zinc-200" : "text-zinc-800"
            }`}
          >
            Architecture Flowchart
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
            isDark
              ? "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy Mermaid Syntax</span>
            </>
          )}
        </button>
      </div>

      {/* Diagram Render Area */}
      <div ref={containerRef} className="flex min-h-[240px] items-center justify-center overflow-x-auto py-2">
        {renderError ? (
          <div className="text-xs text-rose-500">{renderError}</div>
        ) : svgContent ? (
          <div
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-xs text-zinc-500 animate-pulse">Loading diagram...</div>
        )}
      </div>
    </div>
  );
}

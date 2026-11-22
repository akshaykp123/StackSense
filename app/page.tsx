"use client";

import React, { useState, useEffect } from "react";
import { InputScenario } from "@/lib/schemas/inputSchema";
import { OutputRecommendation } from "@/lib/schemas/outputSchema";
import { generateRecommendation } from "@/lib/engine/decisionEngine";
import { PUBLIC_PRESETS, PresetItem } from "@/lib/presets";
import { getOrCreateClientId } from "@/lib/client-identity";
import MermaidViewer from "./components/MermaidViewer";
import {
  Layers,
  Server,
  Database,
  Cloud,
  Cpu,
  AlertTriangle,
  FileDown,
  FileUp,
  RotateCcw,
  Check,
  Globe,
  Smartphone,
  Monitor,
  Workflow,
  Shield,
  Sun,
  Moon,
  ChevronRight,
  Sliders,
  Trash2,
  X,
  Clock,
  Scale,
  Copy,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
} from "lucide-react";

interface SavedArchitectureItem {
  id: string;
  name: string;
  domain: string;
  architectureStyle: string;
  minCost: number;
  maxCost: number;
  scenario: InputScenario;
  recommendation: OutputRecommendation;
  createdAt: string;
}

const formatDriverTag = (tag: string): string => {
  const map: Record<string, string> = {
    "project.platforms": "Platform Target",
    "project.type": "App Domain",
    "scale.workload": "I/O Workload",
    "scale.traffic_pattern": "Traffic Surges",
    "scale.users_12_months": "Target Scale",
    "team.languages": "Language Match",
    "team.experience": "Dev Experience",
    "team.has_devops": "DevOps Staffing",
    "budget.monthly_infra_usd": "Infra Budget",
    "timeline.mvp_weeks": "MVP Timeline",
    "infrastructure.deployment_model": "Cloud Model",
    "infrastructure.cloud_preference": "Cloud Provider",
    "requirements.realtime": "Realtime WebSockets",
    "requirements.seo_critical": "SEO Critical",
    "requirements.full_text_search": "Search Indexing",
    "requirements.file_media_storage": "Object Storage",
    "requirements.auth": "Auth Scheme",
    "requirements.payments": "Payments Gateway",
    "requirements.availability": "High Availability SLA",
  };
  return map[tag] || tag.replace(/_/g, " ").replace(/\./g, " › ");
};

// Proper casing and acronym display mapping (display only, preserves underlying data)
const DOMAIN_DISPLAY_MAP: Record<string, string> = {
  saas_b2b: "B2B SaaS",
  b2b_saas: "B2B SaaS",
  b2b: "B2B",
  b2c: "B2C",
  saas: "SaaS",
  web_app: "Web App",
  fintech: "Fintech",
  marketplace: "Marketplace",
  realtime_collab: "Realtime Collab",
  content_site: "Content Site",
  internal_tool: "Internal Tool",
  other: "General App",
};

const formatDomainDisplay = (val: string): string => {
  if (!val) return "General App";
  if (DOMAIN_DISPLAY_MAP[val]) return DOMAIN_DISPLAY_MAP[val];
  return val
    .replace(/_/g, " ")
    .replace(/\bsaas\b/gi, "SaaS")
    .replace(/\bb2b\b/gi, "B2B")
    .replace(/\bb2c\b/gi, "B2C")
    .replace(/\bapi\b/gi, "API")
    .replace(/\bml\b/gi, "ML")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bsso\b/gi, "SSO")
    .replace(/\bmvp\b/gi, "MVP")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const PLATFORM_DISPLAY_MAP: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
};

const formatPlatformDisplay = (val: string): string => {
  return PLATFORM_DISPLAY_MAP[val] || val.charAt(0).toUpperCase() + val.slice(1);
};

const CAPABILITY_DISPLAY_MAP: Record<string, string> = {
  ai_ml: "AI / ML",
  realtime: "Real-Time Sync",
  enterprise_sso: "Enterprise SSO",
  multi_tenant: "Multi-Tenant",
  mobile_app: "Mobile App",
  global_latency: "Global Low Latency",
  heavy_compute: "Heavy Compute",
  offline_support: "Offline Support",
  full_text_search: "Search Index",
  file_media_storage: "Media Storage",
  payments: "Payments Gateway",
  seo_critical: "SEO Optimized",
};

const formatCapabilityDisplay = (val: string): string => {
  if (CAPABILITY_DISPLAY_MAP[val]) return CAPABILITY_DISPLAY_MAP[val];
  return val
    .replace(/_/g, " ")
    .replace(/\bsso\b/gi, "SSO")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bml\b/gi, "ML")
    .replace(/\bsaas\b/gi, "SaaS")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const CLOUD_DISPLAY_MAP: Record<string, string> = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  agnostic: "Agnostic",
  any: "Agnostic",
};

const WORKLOAD_DISPLAY_MAP: Record<string, string> = {
  read_heavy: "Read-Heavy",
  write_heavy: "Write-Heavy",
  balanced: "Balanced",
  bursty: "Bursty Traffic",
};

const EXPERIENCE_DISPLAY_MAP: Record<string, string> = {
  junior: "Junior Team",
  intermediate: "Mid-Level Team",
  mid: "Mid-Level Team",
  senior: "Senior Engineers",
  mixed: "Mixed Experience",
};

const DEFAULT_BLANK_SCENARIO: InputScenario = {
  scenario_id: "CUSTOM",
  project: {
    name: "Enterprise Platform",
    type: "saas_b2b",
    description: "Production cloud-native web application requiring high reliability and performance.",
    platforms: ["web"],
  },
  scale: {
    traffic_pattern: "steady",
    workload: "balanced",
    users_at_launch: 1000,
    users_12_months: 25000,
    peak_concurrent_users: 500,
    data_volume_gb_12_months: 20,
  },
  team: {
    has_devops: false,
    size: 4,
    experience: "intermediate",
    languages: ["typescript", "python"],
  },
  budget: { monthly_infra_usd: 150 },
  timeline: { mvp_weeks: 8 },
  infrastructure: {
    cloud_preference: "any",
    deployment_model: "managed_cloud",
    data_residency: "none",
    existing_systems: [],
  },
  requirements: {
    realtime: false,
    offline_support: false,
    full_text_search: true,
    file_media_storage: true,
    payments: false,
    auth: "email_password",
    multi_tenant: true,
    ml_features: "none",
    seo_critical: true,
    availability: "99.9",
    p95_latency_ms: 300,
  },
  compliance: [],
  priorities: {
    cost: 3,
    time_to_market: 4,
    scalability: 4,
    performance: 3,
    maintainability: 4,
    security: 3,
  },
};

export interface CuratedPreset {
  id: string;
  badge: string;
  name: string;
  tag: string;
  scenario: InputScenario;
}

const p1Preset = PUBLIC_PRESETS.find((p) => p.id === "P1");
const p4Preset = PUBLIC_PRESETS.find((p) => p.id === "P4");

const CURATED_PRESETS: CuratedPreset[] = [
  {
    id: "devfolio",
    badge: "JAMSTACK",
    name: "DevFolio",
    tag: "Static Content ($0/mo)",
    scenario: p1Preset
      ? p1Preset.scenario
      : {
          ...DEFAULT_BLANK_SCENARIO,
          scenario_id: "P1",
          project: {
            name: "DevFolio",
            type: "content_site",
            description: "Personal portfolio with project pages and a weekly blog.",
            platforms: ["web"],
          },
          budget: { monthly_infra_usd: 0 },
        },
  },
  {
    id: "quickcredit",
    badge: "FINTECH",
    name: "QuickCredit",
    tag: "Digital Lending ($6,000/mo)",
    scenario: p4Preset
      ? p4Preset.scenario
      : {
          ...DEFAULT_BLANK_SCENARIO,
          scenario_id: "P4",
          project: {
            name: "QuickCredit",
            type: "fintech",
            description: "Small personal loans with UPI disbursal and EMI collection.",
            platforms: ["web", "android", "ios"],
          },
          budget: { monthly_infra_usd: 6000 },
        },
  },
  {
    id: "payflow",
    badge: "HIGH-SCALE",
    name: "PayFlow Digital",
    tag: "Fintech & KYC ($600/mo)",
    scenario: {
      scenario_id: "PAYFLOW",
      project: {
        name: "PayFlow Digital",
        type: "fintech",
        description: "Digital lending and payments engine with automated KYC and strict regulatory compliance.",
        platforms: ["web", "android", "ios"],
      },
      scale: {
        traffic_pattern: "spiky",
        workload: "write_heavy",
        users_at_launch: 2500,
        users_12_months: 150000,
        peak_concurrent_users: 2500,
        data_volume_gb_12_months: 100,
      },
      team: {
        has_devops: true,
        size: 6,
        experience: "senior",
        languages: ["typescript", "go"],
      },
      budget: { monthly_infra_usd: 600 },
      timeline: { mvp_weeks: 12 },
      infrastructure: {
        cloud_preference: "aws",
        deployment_model: "managed_cloud",
        data_residency: "india",
        existing_systems: [],
      },
      requirements: {
        realtime: true,
        offline_support: false,
        full_text_search: true,
        file_media_storage: true,
        payments: true,
        auth: "phone_otp",
        multi_tenant: false,
        ml_features: "inference_api",
        seo_critical: false,
        availability: "99.99",
        p95_latency_ms: 150,
      },
      compliance: ["dpdp", "pci_dss"],
      priorities: {
        cost: 2,
        time_to_market: 3,
        scalability: 5,
        performance: 4,
        maintainability: 4,
        security: 5,
      },
    },
  },
  {
    id: "pulse",
    badge: "B2B SAAS",
    name: "Pulse Analytics",
    tag: "Realtime Analytics ($200/mo)",
    scenario: {
      scenario_id: "PULSE",
      project: {
        name: "Pulse Analytics",
        type: "saas_b2b",
        description: "Realtime B2B product analytics dashboard with multi-tenant workspace isolation.",
        platforms: ["web"],
      },
      scale: {
        traffic_pattern: "steady",
        workload: "read_heavy",
        users_at_launch: 1000,
        users_12_months: 50000,
        peak_concurrent_users: 1200,
        data_volume_gb_12_months: 50,
      },
      team: {
        has_devops: false,
        size: 3,
        experience: "intermediate",
        languages: ["typescript"],
      },
      budget: { monthly_infra_usd: 200 },
      timeline: { mvp_weeks: 6 },
      infrastructure: {
        cloud_preference: "any",
        deployment_model: "managed_cloud",
        data_residency: "none",
        existing_systems: [],
      },
      requirements: {
        realtime: true,
        offline_support: false,
        full_text_search: true,
        file_media_storage: true,
        payments: true,
        auth: "email_password",
        multi_tenant: true,
        ml_features: "none",
        seo_critical: true,
        availability: "99.9",
        p95_latency_ms: 250,
      },
      compliance: ["gdpr"],
      priorities: {
        cost: 4,
        time_to_market: 4,
        scalability: 4,
        performance: 3,
        maintainability: 4,
        security: 3,
      },
    },
  },
];

export default function StackSenseApp() {
  const [scenario, setScenario] = useState<InputScenario>(DEFAULT_BLANK_SCENARIO);
  const [recommendation, setRecommendation] = useState<OutputRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"stack" | "diagram" | "tradeoffs" | "json">("stack");
  const [viewMode, setViewMode] = useState<"builder" | "blueprint">("builder");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("stacksense_theme");
        if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
        if (document.documentElement.classList.contains("light")) return "light";
      } catch {
        // Fallback to dark
      }
    }
    return "dark";
  });
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const isDark = theme === "dark";

  // Restore state and theme from storage on page reload/refresh
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("stacksense_theme") as "dark" | "light" | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
      const saved = sessionStorage.getItem("stacksense_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scenario) setScenario(parsed.scenario);
        if (parsed.recommendation) setRecommendation(parsed.recommendation);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.viewMode) {
          setViewMode(parsed.viewMode);
        } else if (parsed.recommendation) {
          setViewMode("blueprint");
        }
      }
    } catch (e) {
      console.error("Failed to restore session state:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Auto-save state to sessionStorage on any change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(
        "stacksense_session",
        JSON.stringify({ scenario, recommendation, activeTab, viewMode })
      );
    } catch {
      // Ignore quota errors
    }
  }, [scenario, recommendation, activeTab, viewMode, isHydrated]);

  // Sync theme with HTML document class & localStorage
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Database persistence state (Neon PostgreSQL)
  const [savedArchitectures, setSavedArchitectures] = useState<SavedArchitectureItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Fetch saved architectures from Neon PostgreSQL (isolated by user's clientId)
  const fetchSavedArchitectures = async () => {
    setIsLoadingHistory(true);
    try {
      const clientId = getOrCreateClientId();
      const res = await fetch(`/api/architectures?clientId=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSavedArchitectures(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load saved architectures:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSavedArchitectures();
  }, []);

  // Toggle between dark and light mode
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("stacksense_theme", next);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Loads or toggles off a curated demo preset
  const handleSelectPreset = (preset: CuratedPreset) => {
    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null);
      setScenario(DEFAULT_BLANK_SCENARIO);
      setRecommendation(null);
      setIsSaved(false);
    } else {
      setSelectedPresetId(preset.id);
      setScenario(preset.scenario);
      setRecommendation(null);
      setIsSaved(false);
    }
  };

  // Runs the decision engine on the current scenario parameters
  const handleSynthesize = () => {
    setIsGenerating(true);
    setIsSaved(false);
    setTimeout(() => {
      try {
        const result = generateRecommendation(scenario);
        setRecommendation(result);
        setActiveTab("stack");
        setViewMode("blueprint");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err) {
        console.error("Decision engine failed:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 160);
  };

  // Saves the active architecture recommendation to Neon PostgreSQL
  const handleSaveToDb = async () => {
    if (!recommendation) return;
    setIsSaving(true);
    try {
      const clientId = getOrCreateClientId();
      const payload = {
        name: scenario.project.name || "Untitled Architecture",
        domain: scenario.project.type || "general",
        architectureStyle: recommendation.architecture_style || "monolith",
        minCost: recommendation.estimated_monthly_cost_usd?.min ?? 0,
        maxCost: recommendation.estimated_monthly_cost_usd?.max ?? 0,
        scenario,
        recommendation,
        clientId,
      };

      const res = await fetch("/api/architectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSaved(true);
        await fetchSavedArchitectures();
      } else {
        const errorJson = await res.json().catch(() => null);
        alert(errorJson?.error || "Failed to save architecture. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save to database:", err);
      alert("Error saving architecture to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Loads a saved architecture into the workspace
  const handleLoadSaved = (item: SavedArchitectureItem) => {
    setScenario(item.scenario);
    setRecommendation(item.recommendation);
    setActiveTab("stack");
    setIsSaved(true);
    setIsHistoryOpen(false);
    setViewMode("blueprint");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Deletes a saved architecture from database
  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved architecture?")) return;
    try {
      const clientId = getOrCreateClientId();
      const res = await fetch(`/api/architectures?id=${encodeURIComponent(id)}&clientId=${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedArchitectures((prev) => prev.filter((a) => a.id !== id));
      } else {
        const errorJson = await res.json().catch(() => null);
        alert(errorJson?.error || "Failed to delete architecture.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Resets the scenario form back to defaults
  const handleReset = () => {
    setSelectedPresetId(null);
    setScenario(DEFAULT_BLANK_SCENARIO);
    setRecommendation(null);
    setActiveTab("stack");
    setIsSaved(false);
    setViewMode("builder");
    try {
      sessionStorage.removeItem("stacksense_session");
    } catch {
      // Ignore
    }
  };

  // Imports a user-uploaded JSON scenario file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSelectedPresetId(parsed.scenario_id || null);
        setScenario(parsed);
        const result = generateRecommendation(parsed);
        setRecommendation(result);
        setActiveTab("stack");
        setViewMode("blueprint");
      } catch {
        alert("Invalid JSON format. Please upload a valid StackSense configuration file.");
      }
    };
    reader.readAsText(file);
  };

  // Exports the recommendation as a JSON file
  const downloadOutputJson = () => {
    if (!recommendation) return;
    const blob = new Blob([JSON.stringify(recommendation, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stacksense_${(scenario.project.name || "blueprint").toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    if (!recommendation) return;
    navigator.clipboard.writeText(JSON.stringify(recommendation, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Toggles platforms (Web, Android, iOS, Desktop)
  const togglePlatform = (plat: "web" | "android" | "ios" | "desktop") => {
    const current = scenario.project.platforms;
    const exists = current.includes(plat as any);
    if (exists && current.length === 1) return;
    const updated = exists ? current.filter((p) => p !== plat) : [...current, plat as any];
    setScenario({
      ...scenario,
      project: { ...scenario.project, platforms: updated },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      {/* ======================================================== */}
      {/* TOP-LEVEL STICKY HEADER (Subtle, Linear/Vercel Style)     */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/95 backdrop-blur-md transition-colors duration-150">
        <div className="app-container flex h-full items-center justify-between">
          {/* Logo & Product Name */}
          <div className="flex items-center gap-3.5 shrink-0">
            <Layers className="h-6 w-6 sm:h-[26px] sm:w-[26px] text-[var(--accent)] stroke-[2]" />
            <div className="flex items-center gap-2.5">
              <span className="text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                StackSense
              </span>
              <span className="text-[var(--border-strong)] text-[15px] font-light hidden sm:inline">/</span>
              <span className="text-[13px] sm:text-[14px] font-normal text-[var(--text-tertiary)] hidden sm:inline">
                Architecture Engine
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Reset Parameters (Ghost) */}
            <button
              onClick={handleReset}
              title="Reset parameters to default"
              className="flex h-9 items-center gap-1.5 rounded-lg px-2 sm:px-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <RotateCcw className="h-3.5 w-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-0.5 hidden sm:block" />

            {/* Import Configuration (Secondary) */}
            <label
              title="Import configuration JSON"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 sm:px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <FileUp className="h-3.5 w-3.5 stroke-[1.5] text-[var(--text-tertiary)]" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Export Blueprint JSON (Secondary - Only displayed when blueprint exists) */}
            {recommendation && (
              <button
                onClick={downloadOutputJson}
                title="Export architecture JSON"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 sm:px-3 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <FileDown className="h-3.5 w-3.5 stroke-[1.5] text-[var(--text-tertiary)]" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* Saved Architectures Trigger (Subtle Status Indicator: dot + text) */}
            <button
              type="button"
              onClick={() => {
                fetchSavedArchitectures();
                setIsHistoryOpen(true);
              }}
              title="View saved architectures"
              className="flex items-center gap-1.5 sm:gap-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-raised)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  savedArchitectures.length > 0 ? "bg-[var(--accent)]" : "bg-[var(--text-tertiary)]"
                }`}
              />
              <span className="hidden sm:inline">{savedArchitectures.length} Saved</span>
              <span className="sm:hidden font-mono text-[11px]">{savedArchitectures.length}</span>
            </button>

            <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-0.5 hidden sm:block" />

            {/* Theme Toggle (Ghost / Icon) */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 stroke-[1.5]" /> : <Moon className="h-3.5 w-3.5 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTENT CONTAINER (Shared app-container)             */}
      {/* ======================================================== */}
      <main className="app-container py-10 sm:py-14 space-y-12 sm:space-y-16 pb-28 sm:pb-32">
        {viewMode === "builder" || !recommendation ? (
          /* ======================================================== */
          /* BUILDER VIEW (Clean, Calm, Single-Level Cards)           */
          /* ======================================================== */
          <div className="w-full space-y-10 sm:space-y-12">
            {/* Page Title & Editorial Intro */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2">
              <div>
                <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  Define Architecture Requirements
                </h1>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-[var(--text-secondary)] max-w-2xl">
                  Configure scale, engineering constraints, and workload dynamics for deterministic tech stack synthesis.
                </p>
              </div>

              {recommendation && (
                <button
                  type="button"
                  onClick={() => setViewMode("blueprint")}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shrink-0 self-start sm:self-auto shadow-[var(--shadow-card)]"
                >
                  <span>View Current Blueprint</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
                </button>
              )}
            </div>

            {/* Quick Demo Presets (Rendered directly on page background) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Demo Archetypes
                </span>
                <span className="text-[12px] text-[var(--text-tertiary)]">
                  Select archetype to load · Click again to deselect
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {CURATED_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  const priceText = `$${p.scenario.budget.monthly_infra_usd.toLocaleString()}/mo`;
                  const categoryText = p.tag.replace(/\s*\(\$.*?\)/, "");

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-[5px] bg-[var(--bg-raised)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                          {p.badge}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent)]"
                              : "border-[var(--border-strong)] bg-transparent"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[14px] font-semibold mt-3 text-[var(--text-primary)]">
                        {p.name}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-[12px]">
                        <span className="text-[var(--text-tertiary)] truncate">{categoryText}</span>
                        <span className="font-mono tabular-nums text-[var(--text-secondary)] shrink-0 ml-2">
                          {priceText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Column Responsive Layout: Forms on Left (8 cols), Live Summary on Right (4 cols) */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Form Sections (Left 8 Columns, 48-56px gap) */}
              <div className="lg:col-span-8 space-y-12 sm:space-y-14">
                {/* Section 1: Project Scope & Platform Target */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                  <div className="border-b border-[var(--border-subtle)] pb-4">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      01
                    </span>
                    <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mt-0.5">
                      Project Scope & Platforms
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] truncate">
                      Core product identity, target platforms, and launch timelines
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="max-w-[640px]">
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={scenario.project.name || ""}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            project: { ...scenario.project, name: e.target.value },
                          })
                        }
                        className="h-10 w-full max-w-[640px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        placeholder="e.g. Acme Cloud Platform"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          Application Domain
                        </label>
                        <select
                          value={scenario.project.type}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              project: { ...scenario.project, type: e.target.value as any },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        >
                          <option value="saas_b2b">B2B SaaS Platform</option>
                          <option value="web_app">Web Application</option>
                          <option value="fintech">Fintech & Banking</option>
                          <option value="marketplace">On-Demand Marketplace</option>
                          <option value="realtime_collab">Realtime Collaboration</option>
                          <option value="content_site">Content Site / Blog</option>
                          <option value="internal_tool">Internal Enterprise Tool</option>
                          <option value="other">General Application</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          Launch Timeline
                        </label>
                        <select
                          value={scenario.timeline.mvp_weeks}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              timeline: { mvp_weeks: Number(e.target.value) },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        >
                          <option value={2}>2 Weeks (MVP Blitz)</option>
                          <option value={6}>6 Weeks (Fast Track)</option>
                          <option value={12}>12 Weeks (Standard)</option>
                          <option value={24}>24 Weeks (Hardened)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-2 block">
                        Target Platforms
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: "web", label: "Web Application", icon: Globe },
                          { id: "android", label: "Android Mobile", icon: Smartphone },
                          { id: "ios", label: "iOS Mobile", icon: Smartphone },
                          { id: "desktop", label: "Desktop Native", icon: Monitor },
                        ].map(({ id, label, icon: Icon }) => {
                          const isSelected = scenario.project.platforms.includes(id as any);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => togglePlatform(id as any)}
                              className={`flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                                isSelected
                                  ? "bg-[var(--accent)] text-white shadow-xs"
                                  : "border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Scale, Concurrency & Workload Dynamics */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                  <div className="border-b border-[var(--border-subtle)] pb-4">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      02
                    </span>
                    <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mt-0.5">
                      Scale & Traffic Dynamics
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] truncate">
                      Target concurrency, volume growth, and I/O access patterns
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* User Scale Slider (No Gray Container, Large Readout, Filled Accent Track) */}
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <label className="text-[13px] font-medium text-[var(--text-primary)]">
                          12-Month Target Active Users
                        </label>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
                            {scenario.scale.users_12_months.toLocaleString()}
                          </span>
                          <span className="text-[12px] text-[var(--text-tertiary)] font-normal">
                            active users
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={300000}
                        step={1000}
                        value={scenario.scale.users_12_months}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            scale: {
                              ...scenario.scale,
                              users_12_months: Number(e.target.value),
                            },
                          })
                        }
                        style={{
                          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${Math.min(100, Math.max(0, ((scenario.scale.users_12_months - 200) / (300000 - 200)) * 100))}%, var(--border-strong) ${Math.min(100, Math.max(0, ((scenario.scale.users_12_months - 200) / (300000 - 200)) * 100))}%, var(--border-strong) 100%)`,
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[12px] text-[var(--text-tertiary)] font-sans">
                        <span>200 (Seed)</span>
                        <span>50,000 (Growth)</span>
                        <span>300,000+ (Enterprise)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          I/O Workload Profile
                        </label>
                        <select
                          value={scenario.scale.workload}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              scale: { ...scenario.scale, workload: e.target.value as any },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        >
                          <option value="balanced">Balanced (Standard CRUD)</option>
                          <option value="read_heavy">Read-Heavy (Cacheable / Content)</option>
                          <option value="write_heavy">Write-Heavy (Ingestion / Telemetry)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          Traffic Surge Profile
                        </label>
                        <select
                          value={scenario.scale.traffic_pattern}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              scale: { ...scenario.scale, traffic_pattern: e.target.value as any },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        >
                          <option value="steady">Steady & Predictable</option>
                          <option value="spiky">Spiky Flash Surges</option>
                          <option value="seasonal">Seasonal Bursts</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Cloud Budget & Team Constraints */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                  <div className="border-b border-[var(--border-subtle)] pb-4">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      03
                    </span>
                    <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mt-0.5">
                      Cloud Budget & Team Experience
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] truncate">
                      Financial expenditure caps and developer team capabilities
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Cloud Budget Slider (No Gray Container, Large Readout, Filled Accent Track) */}
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <label className="text-[13px] font-medium text-[var(--text-primary)]">
                          Monthly Infrastructure Budget Cap
                        </label>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
                            ${scenario.budget.monthly_infra_usd.toLocaleString()}
                          </span>
                          <span className="text-[12px] text-[var(--text-tertiary)] font-normal">
                            / mo
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={3000}
                        step={25}
                        value={scenario.budget.monthly_infra_usd}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            budget: { monthly_infra_usd: Number(e.target.value) },
                          })
                        }
                        style={{
                          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${Math.min(100, Math.max(0, (scenario.budget.monthly_infra_usd / 3000) * 100))}%, var(--border-strong) ${Math.min(100, Math.max(0, (scenario.budget.monthly_infra_usd / 3000) * 100))}%, var(--border-strong) 100%)`,
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[12px] text-[var(--text-tertiary)] font-sans">
                        <span>$0 (Free Tier)</span>
                        <span>$200 (Starter)</span>
                        <span>$3,000+ (Enterprise)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Number Stepper for Team Size */}
                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          Engineering Team Size
                        </label>
                        <div className="flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2">
                          <button
                            type="button"
                            onClick={() =>
                              setScenario({
                                ...scenario,
                                team: { ...scenario.team, size: Math.max(1, scenario.team.size - 1) },
                              })
                            }
                            disabled={scenario.team.size <= 1}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Decrease team size"
                          >
                            <Minus className="h-3.5 w-3.5 stroke-[1.5]" />
                          </button>
                          <span className="font-mono tabular-nums text-[14px] font-semibold text-[var(--text-primary)]">
                            {scenario.team.size} {scenario.team.size === 1 ? "engineer" : "engineers"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setScenario({
                                ...scenario,
                                team: { ...scenario.team, size: Math.min(25, scenario.team.size + 1) },
                              })
                            }
                            disabled={scenario.team.size >= 25}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Increase team size"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                          Team Seniority Profile
                        </label>
                        <select
                          value={scenario.team.experience}
                          onChange={(e) =>
                            setScenario({
                              ...scenario,
                              team: { ...scenario.team, experience: e.target.value as any },
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                        >
                          <option value="beginner">Beginner (Velocity focus)</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="senior">Senior (Distributed affinity)</option>
                          <option value="mixed">Mixed Seniority</option>
                        </select>
                      </div>
                    </div>

                    {/* Dedicated DevOps Engineer Switch Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4">
                      <div>
                        <div className="text-[13px] font-medium text-[var(--text-primary)]">
                          Dedicated DevOps Engineer
                        </div>
                        <div className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                          Unlocks self-managed container orchestration & Kubernetes
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={scenario.team.has_devops}
                        onClick={() =>
                          setScenario({
                            ...scenario,
                            team: { ...scenario.team, has_devops: !scenario.team.has_devops },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                          scenario.team.has_devops ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            scenario.team.has_devops ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4: Cloud Infrastructure & Governance */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                  <div className="border-b border-[var(--border-subtle)] pb-4">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      04
                    </span>
                    <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mt-0.5">
                      Infrastructure & Governance
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] truncate">
                      Deployment tier, cloud platform preferences, and compliance residency
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                        Cloud Provider Preference
                      </label>
                      <select
                        value={scenario.infrastructure.cloud_preference}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            infrastructure: {
                              ...scenario.infrastructure,
                              cloud_preference: e.target.value as any,
                            },
                          })
                        }
                        className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                      >
                        <option value="any">Any Cloud (Best-Fit Optimization)</option>
                        <option value="aws">Amazon Web Services (AWS)</option>
                        <option value="gcp">Google Cloud Platform (GCP)</option>
                        <option value="azure">Microsoft Azure</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                        Deployment Model
                      </label>
                      <select
                        value={scenario.infrastructure.deployment_model}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            infrastructure: {
                              ...scenario.infrastructure,
                              deployment_model: e.target.value as any,
                            },
                          })
                        }
                        className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                      >
                        <option value="managed_cloud">Managed Cloud (Serverless / PaaS)</option>
                        <option value="self_hosted_cloud_vm">Virtual Machines (IaaS)</option>
                        <option value="on_premise">On-Premise Private Hardware</option>
                        <option value="air_gapped">Air-Gapped (Isolated / Offline)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                        Data Residency Constraint
                      </label>
                      <select
                        value={scenario.infrastructure.data_residency}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            infrastructure: {
                              ...scenario.infrastructure,
                              data_residency: e.target.value as any,
                            },
                          })
                        }
                        className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                      >
                        <option value="none">Global / No Restriction</option>
                        <option value="india">India (RBI / DPDP)</option>
                        <option value="eu">European Union (GDPR)</option>
                        <option value="us">United States</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 5: Technical Capabilities & Requirements */}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                  <div className="border-b border-[var(--border-subtle)] pb-4">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      05
                    </span>
                    <h2 className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-[var(--text-primary)] mt-0.5">
                      Technical Capabilities & Requirements
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[var(--text-secondary)] truncate">
                      Architectural features, protocols, and security requirements
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Selectable Capability Cards with Custom Accent Checkboxes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: "realtime", label: "Realtime WebSockets" },
                        { key: "offline_support", label: "Offline-First Sync" },
                        { key: "payments", label: "Payment Gateway" },
                        { key: "full_text_search", label: "Full-Text Search" },
                        { key: "file_media_storage", label: "Object Media Storage" },
                        { key: "seo_critical", label: "SEO Indexing Critical" },
                      ].map(({ key, label }) => {
                        const isChecked = Boolean((scenario.requirements as any)[key]);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setScenario({
                                ...scenario,
                                requirements: {
                                  ...scenario.requirements,
                                  [key]: !isChecked,
                                },
                              })
                            }
                            className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                              isChecked
                                ? "border-[var(--accent)] bg-[var(--accent)]/[0.06] text-[var(--text-primary)] shadow-xs"
                                : "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                  : "border-[var(--border-strong)] bg-[var(--bg-surface)]"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
                            </div>
                            <span className="text-[13px] font-medium truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[var(--text-primary)] mb-1.5 block">
                        Authentication Scheme
                      </label>
                      <select
                        value={scenario.requirements.auth}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            requirements: {
                              ...scenario.requirements,
                              auth: e.target.value as any,
                            },
                          })
                        }
                        className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-[14px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors duration-150"
                      >
                        <option value="none">None (Public Read-Only)</option>
                        <option value="email_password">Email & Password Auth</option>
                        <option value="phone_otp">Phone OTP (SMS Verification)</option>
                        <option value="enterprise_sso">Enterprise SSO (SAML / OIDC)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Configuration Summary Panel (Right 4 Columns on Desktop) */}
              <div className="hidden lg:block lg:col-span-4 sticky top-20 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-none space-y-4">
                <div className="rounded-xl bg-[var(--bg-surface)] p-6 sm:p-7 space-y-5">
                  <div className="border-b border-[var(--border-subtle)] pb-3">
                    <span className="text-[11px] font-mono font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] block">
                      Configuration Summary
                    </span>
                    <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                      {scenario.project.name || "Untitled System"}
                    </h3>
                  </div>

                  <div className="space-y-3.5 text-[13px]">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block">
                        Domain & Platforms
                      </span>
                      <span className="text-[var(--text-primary)] font-medium mt-0.5 block truncate">
                        {formatDomainDisplay(scenario.project.type)} · {scenario.project.platforms.length > 0 ? scenario.project.platforms.map((p) => formatPlatformDisplay(p)).join(", ") : "None selected"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-3">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block">
                          Scale (12 Mo)
                        </span>
                        <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold mt-0.5 block">
                          {scenario.scale.users_12_months.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] truncate block">
                          {WORKLOAD_DISPLAY_MAP[scenario.scale.workload] || scenario.scale.workload.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block">
                          Monthly Cap
                        </span>
                        <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold mt-0.5 block">
                          ${scenario.budget.monthly_infra_usd.toLocaleString()}/mo
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] block">
                          {CLOUD_DISPLAY_MAP[scenario.infrastructure.cloud_preference.toLowerCase()] || scenario.infrastructure.cloud_preference.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-3">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block">
                          Team & Velocity
                        </span>
                        <span className="text-[var(--text-primary)] font-medium mt-0.5 block">
                          {scenario.team.size} {scenario.team.size === 1 ? "engineer" : "engineers"}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] block">
                          {scenario.timeline.mvp_weeks}w MVP
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block">
                          DevOps Lead
                        </span>
                        <span className="text-[var(--text-primary)] font-medium mt-0.5 block">
                          {scenario.team.has_devops ? "Dedicated" : "None"}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)] block">
                          {EXPERIENCE_DISPLAY_MAP[scenario.team.experience] || scenario.team.experience}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-subtle)] pt-3">
                      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block mb-1.5">
                        Enabled Capabilities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(scenario.requirements)
                          .filter(([, v]) => v === true)
                          .map(([k]) => (
                            <span
                              key={k}
                              className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] font-medium"
                            >
                              {formatCapabilityDisplay(k)}
                            </span>
                          ))}
                        {Object.entries(scenario.requirements).filter(([, v]) => v === true).length === 0 && (
                          <span className="text-[12px] text-[var(--text-tertiary)] italic">
                            None selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* BLUEPRINT VIEW (Editorial, Clean, Linear/Stripe Inspired) */
          /* ======================================================== */
          <div className="w-full space-y-8">
            {/* Top Navigation & Action Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode("builder")}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Modify Parameters</span>
                </button>

                <span className="text-[var(--border-strong)] text-[12px]">/</span>
                <span className="text-[13px] font-medium text-[var(--text-secondary)] truncate">
                  {scenario.project.name || "Custom Architecture"}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleSaveToDb}
                  disabled={isSaving}
                  title="Save architecture to database"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)]"
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
                      <span>Saving...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[var(--success)] stroke-[2]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3.5 w-3.5 stroke-[1.5] text-[var(--text-tertiary)]" />
                      <span>Save Architecture</span>
                    </>
                  )}
                </button>

                <button
                  onClick={downloadOutputJson}
                  title="Export architecture JSON"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)]"
                >
                  <FileDown className="h-3.5 w-3.5 stroke-[1.5] text-[var(--text-tertiary)]" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Executive Blueprint Overview Card (Single Level, Stat Row) */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
              {/* Header: Title + Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-2.5 py-0.5 text-[12px] font-mono font-medium text-[var(--text-secondary)]">
                    Pattern: {recommendation.architecture_style.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    <span>{recommendation.status === "ok" ? "Specification: Validated" : "Review: Constraints Flagged"}</span>
                  </span>
                </div>

                <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] leading-tight">
                  {scenario.project.name || "System"} Architectural Blueprint
                </h1>
              </div>

              {/* Architectural Synthesis & Strategic Rationale */}
              <div className="border-l-2 border-[var(--accent)] pl-4 py-0.5">
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[var(--text-secondary)] max-w-[70ch]">
                  {recommendation.summary}
                </p>
              </div>

              {/* Clean Stat Row with Thin Vertical Dividers (Evenly Distributed Across 1600px Container) */}
              <div className="border-t border-[var(--border-subtle)] pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)] items-start w-full">
                  {/* Stat 1: Cloud Spend */}
                  <div className="md:pr-6 md:pl-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      Est. Cloud Spend
                    </div>
                    <div className="text-[20px] sm:text-[22px] font-mono tabular-nums font-semibold text-[var(--text-primary)] mt-1">
                      ${recommendation.estimated_monthly_cost_usd.min} - ${recommendation.estimated_monthly_cost_usd.max}
                      <span className="text-[12px] font-sans font-normal text-[var(--text-tertiary)]"> / mo</span>
                    </div>
                  </div>

                  {/* Stat 2: Target Scale */}
                  <div className="md:px-6 pt-4 md:pt-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      Target Scale
                    </div>
                    <div className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-primary)] mt-1 whitespace-nowrap">
                      {scenario.scale.users_12_months.toLocaleString()} Users
                    </div>
                  </div>

                  {/* Stat 3: Workload Pattern */}
                  <div className="md:px-6 pt-4 md:pt-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      Workload Pattern
                    </div>
                    <div className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-primary)] mt-1 whitespace-nowrap capitalize">
                      {scenario.scale.workload.replace(/_/g, " ")}
                    </div>
                  </div>

                  {/* Stat 4: Deployment Model */}
                  <div className="md:px-6 pt-4 md:pt-0">
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      Deployment Model
                    </div>
                    <div className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-primary)] mt-1 whitespace-nowrap capitalize">
                      {scenario.infrastructure.deployment_model.replace(/_/g, " ")}
                    </div>
                  </div>

                  {/* Stat 5: MVP Blitz */}
                  <div className="md:pl-6 md:pr-0 pt-4 md:pt-0 col-span-2 md:col-span-1">
                    <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      MVP Target
                    </div>
                    <div className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-primary)] mt-1 whitespace-nowrap">
                      {scenario.timeline.mvp_weeks} Weeks
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Warnings (if any) */}
              {recommendation.warnings.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  {recommendation.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-muted)] p-3 text-[13px] text-[var(--warning)]"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 stroke-[1.5]" />
                      <div>
                        <span className="font-semibold">{w.code}: </span>
                        <span>{w.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* STICKY UNDERLINED TAB BAR (Clean, Linear/Vercel Style)    */}
            {/* ======================================================== */}
            <div className="sticky top-16 z-30 bg-[var(--bg-app)] backdrop-blur-md border-b border-[var(--border-subtle)] pt-1 w-full overflow-hidden">
              <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
                {[
                  { id: "stack", label: "Core Stack" },
                  { id: "diagram", label: "Architecture Flowchart" },
                  { id: "tradeoffs", label: "Trade-offs & Alternatives" },
                  { id: "json", label: "JSON Blueprint" },
                ].map(({ id, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`whitespace-nowrap pb-3 text-[14px] font-medium transition-colors duration-150 relative shrink-0 ${
                        isActive
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <span>{label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: Core Stack                                        */}
            {/* ======================================================== */}
            {activeTab === "stack" && recommendation.stack && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                  {[
                    { layer: "frontend", label: "Frontend Layer", data: recommendation.stack.frontend },
                    { layer: "backend", label: "Backend Layer", data: recommendation.stack.backend },
                    { layer: "database", label: "Database Layer", data: recommendation.stack.database },
                    { layer: "hosting", label: "Cloud Hosting", data: recommendation.stack.hosting },
                  ].map(({ layer, label, data }) => (
                    <div
                      key={layer}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between hover:border-[var(--border-hover)] transition-colors duration-150 h-full"
                    >
                      <div className="space-y-4">
                        {/* Category Label + Quiet Recommended Tag */}
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                            {label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                            <span>Recommended</span>
                          </span>
                        </div>

                        {/* Component Name */}
                        <h3 className="text-[19px] sm:text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                          {data.choice}
                        </h3>

                        {/* Justification Text (Capped at ~70ch for readability) */}
                        <p className="text-[14px] leading-[1.6] text-[var(--text-secondary)] max-w-[70ch]">
                          {data.justification}
                        </p>

                        {/* Deciding Criteria Tags */}
                        <div className="pt-2">
                          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block mb-2">
                            Key Decision Drivers
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {data.driven_by.map((f, i) => (
                              <span
                                key={i}
                                className="rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-2.5 py-1 text-[12px] font-mono text-[var(--text-secondary)]"
                              >
                                {formatDriverTag(f)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Alternative Preview (Clean Divider at Bottom) */}
                      {data.alternatives.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
                          <div className="text-[12px] text-[var(--text-tertiary)]">
                            <span className="font-medium text-[var(--text-secondary)]">Alternative: </span>
                            <span className="text-[var(--text-primary)] font-medium">{data.alternatives[0].choice}</span>
                            <span className="block mt-0.5 text-[13px] text-[var(--text-tertiary)] leading-normal max-w-[70ch]">
                              {data.alternatives[0].why_not}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Supporting Infrastructure Services */}
                {recommendation.stack.supporting.length > 0 && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-4">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
                        Supporting Infrastructure & Integrations
                      </h3>
                      <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
                        Complementary platform services configured for this workload profile
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                      {recommendation.stack.supporting.map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4 space-y-1.5 flex flex-col justify-between h-full"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-tertiary)] font-medium">
                              <span>{s.layer}</span>
                              <span className="text-[var(--success)] font-medium">Active</span>
                            </div>
                            <div className="text-[14px] font-semibold text-[var(--text-primary)] mt-1">
                              {s.choice}
                            </div>
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-[70ch] mt-1">
                              {s.justification}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: System Architecture Flowchart                     */}
            {/* ======================================================== */}
            {activeTab === "diagram" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">Topology Flow:</span>
                    <span className="text-[var(--text-secondary)]">
                      Client Application ➔ Global Edge CDN ➔ Services ➔ Database / Storage
                    </span>
                  </div>
                  <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                    Deterministic Render
                  </span>
                </div>

                {recommendation.mermaid_diagram ? (
                  <MermaidViewer chart={recommendation.mermaid_diagram} isDark={isDark} />
                ) : (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center text-[13px] text-[var(--text-tertiary)]">
                    No diagram syntax available.
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: Decision Matrix & Trade-Offs                      */}
            {/* ======================================================== */}
            {activeTab === "tradeoffs" && recommendation.stack && (
              <div className="space-y-6">
                {/* Header Description */}
                <div>
                  <h2 className="text-[19px] sm:text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">
                    Decision Matrix & Trade-off Analysis
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--text-secondary)] max-w-2xl">
                    Transparent evaluation showing why recommended technologies were selected over alternatives based on scale, budget, and operational overhead.
                  </p>
                </div>

                {/* 4 Head-to-Head Comparison Layers */}
                <div className="space-y-6">
                  {[
                    { layer: "Frontend Layer", item: recommendation.stack.frontend, altFallback: "Next.js / Remix" },
                    { layer: "Backend Layer", item: recommendation.stack.backend, altFallback: "Node.js Express / NestJS" },
                    { layer: "Database Layer", item: recommendation.stack.database, altFallback: "PostgreSQL / MongoDB" },
                    { layer: "Cloud Hosting", item: recommendation.stack.hosting, altFallback: "AWS Fargate / Fly.io" },
                  ].map(({ layer, item, altFallback }, idx) => {
                    const alternative = item.alternatives[0];

                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                            0{idx + 1} · {layer}
                          </span>
                          <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                            Status: Finalized
                          </span>
                        </div>

                        {/* Dual Side-by-Side Comparison (Equal Height Cards & 24px Gap) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                          {/* Recommended Choice (Visually Elevated) */}
                          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--accent)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                  <span>Recommended Choice</span>
                                </span>
                                <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                                  Primary
                                </span>
                              </div>

                              <h4 className="text-[18px] sm:text-[19px] font-semibold text-[var(--text-primary)]">
                                {item.choice}
                              </h4>

                              <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-secondary)] max-w-[70ch]">
                                {item.justification}
                              </p>
                            </div>

                            {/* Key Criteria Satisfied (Clean List instead of Badges) */}
                            <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)]">
                              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block mb-2">
                                Satisfied Constraints
                              </span>
                              <ul className="space-y-1.5">
                                {item.driven_by.map((d, i) => (
                                  <li key={i} className="text-[13px] text-[var(--text-secondary)] flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                                    <span>{formatDriverTag(d)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Evaluated Alternative (Muted) */}
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-6 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                                  Evaluated Alternative
                                </span>
                                <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                                  Secondary
                                </span>
                              </div>

                              <h4 className="text-[18px] sm:text-[19px] font-medium text-[var(--text-secondary)]">
                                {alternative?.choice || altFallback}
                              </h4>

                              <p className="mt-2 text-[14px] leading-[1.6] text-[var(--text-tertiary)] max-w-[70ch]">
                                {alternative?.why_not || "Did not match resource, operational, or budget constraints of this scenario."}
                              </p>
                            </div>

                            <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)]">
                              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-tertiary)] block mb-1.5">
                                Trade-off Assessment
                              </span>
                              <p className="text-[13px] leading-relaxed text-[var(--text-tertiary)] max-w-[70ch]">
                                Higher operational overhead, runtime maintenance, or mismatch with current team skill affinity.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Architectural Assumptions & Boundary Conditions */}
                {recommendation.assumptions.length > 0 && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-3">
                    <h4 className="text-[15px] font-semibold text-[var(--text-primary)]">
                      System Boundary Assumptions & Operating Constraints
                    </h4>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      These baseline assumptions ground the validity of the recommended architecture:
                    </p>
                    <ul className="space-y-2 pt-1">
                      {recommendation.assumptions.map((assumption, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-2" />
                          <span>{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: JSON Blueprint                                    */}
            {/* ======================================================== */}
            {activeTab === "json" && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono text-[var(--text-tertiary)]">
                      output_recommendation.json
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[var(--success)] stroke-[2]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadOutputJson}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 text-[12px] font-medium transition-colors duration-150"
                    >
                      <FileDown className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="max-h-[540px] overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4 font-mono text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {JSON.stringify(recommendation, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* STICKY BOTTOM ACTION BAR (Full-Width with Shared Container) */}
      {/* ======================================================== */}
      {(viewMode === "builder" || !recommendation) && (
        <div className="sticky bottom-0 z-30 w-full border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/95 backdrop-blur-md shadow-lg">
          <div className="app-container py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                {scenario.project.name || "System"} · {formatDomainDisplay(scenario.project.type)} · {scenario.scale.users_12_months.toLocaleString()} Users · ${scenario.budget.monthly_infra_usd.toLocaleString()}/mo · {scenario.timeline.mvp_weeks}w MVP
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] hidden sm:block">
                Deterministic synthesis across {scenario.project.platforms.length} platform(s) · {scenario.team.has_devops ? "DevOps Ready" : "Developer Velocity"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isGenerating}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 text-[14px] font-medium text-white shadow-xs transition-all duration-150 active:scale-[0.99] disabled:opacity-50 shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin stroke-[2]" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Synthesize Architecture</span>
                  <ArrowRight className="h-4 w-4 stroke-[2]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SAVED ARCHITECTURES MODAL (Clean, Polished)              */}
      {/* ======================================================== */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)] overflow-hidden transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 stroke-[1.5] text-[var(--text-tertiary)]" />
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                  Saved Architectures
                </h3>
                <span className="rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-2 py-0.5 text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
                  {savedArchitectures.length} saved
                </span>
              </div>

              <button
                onClick={() => setIsHistoryOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors duration-150"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
                  <RotateCcw className="h-5 w-5 animate-spin mb-2 stroke-[1.5]" />
                  <span className="text-[13px]">Loading saved architectures...</span>
                </div>
              ) : savedArchitectures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <Clock className="h-6 w-6 stroke-[1.5] text-[var(--text-tertiary)]" />
                  <h4 className="text-[14px] font-medium text-[var(--text-primary)]">
                    No saved architectures in this session
                  </h4>
                  <p className="text-[13px] max-w-sm text-[var(--text-tertiary)]">
                    Your architectures are preserved securely in PostgreSQL. Click &quot;Save Architecture&quot; on any recommendation to view it here.
                  </p>
                </div>
              ) : (
                savedArchitectures.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)] hover:border-[var(--border-hover)] transition-all duration-150"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                          {item.name}
                        </span>
                        <span className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-medium uppercase text-[var(--text-secondary)]">
                          {item.architectureStyle.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {item.domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)] font-mono tabular-nums">
                        <span className="text-[var(--accent)] font-medium">
                          ${item.minCost} - ${item.maxCost} / mo
                        </span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleLoadSaved(item)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[12px] font-medium text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)] transition-colors duration-150 shadow-[var(--shadow-card)]"
                      >
                        <span>Load</span>
                        <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        title="Delete architecture"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--danger-border)] hover:bg-[var(--danger-muted)] hover:text-[var(--danger)] transition-colors duration-150"
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-3 text-[12px] text-[var(--text-tertiary)]">
              <span>Isolated session storage (PostgreSQL)</span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

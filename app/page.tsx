"use client";

import React, { useState, useEffect } from "react";
import { InputScenario } from "@/lib/schemas/inputSchema";
import { OutputRecommendation } from "@/lib/schemas/outputSchema";
import { generateRecommendation } from "@/lib/engine/decisionEngine";
import { PUBLIC_PRESETS, PresetItem } from "@/lib/presets";
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
  DollarSign,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Check,
  FileCode,
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
  Zap,
  Sparkles,
  Scale,
  XCircle,
  ShieldCheck,
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

const DEMO_PRESETS = PUBLIC_PRESETS.filter((p) => p.id === "P1" || p.id === "P4");

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

// Curated enterprise templates for instant one-click testing inside empty canvas
const ENTERPRISE_DEMOS: Record<string, Partial<InputScenario>> = {
  fintech: {
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
  },
  saas: {
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
  },
};

export default function StackSenseApp() {
  const [scenario, setScenario] = useState<InputScenario>(DEFAULT_BLANK_SCENARIO);
  const [recommendation, setRecommendation] = useState<OutputRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"stack" | "diagram" | "tradeoffs" | "json">("stack");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const isDark = theme === "dark";

  // Restore state from sessionStorage on page reload/refresh
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("stacksense_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scenario) setScenario(parsed.scenario);
        if (parsed.recommendation) setRecommendation(parsed.recommendation);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
      }
    } catch (e) {
      console.error("Failed to restore session state:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Auto-save state to sessionStorage on any change (preserves across F5, wiped on tab close)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(
        "stacksense_session",
        JSON.stringify({ scenario, recommendation, activeTab })
      );
    } catch (e) {
      // Ignore quota errors
    }
  }, [scenario, recommendation, activeTab, isHydrated]);

  // Sync theme with HTML document class
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

  // Fetch saved architectures from Neon PostgreSQL
  const fetchSavedArchitectures = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/architectures");
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

  // Load saved architectures on mount
  useEffect(() => {
    fetchSavedArchitectures();
  }, []);

  // Toggle between dark and light mode
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Loads a demo preset (e.g. DevFolio or QuickCredit) into the form inputs
  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setScenario(preset.scenario);
  };

  // Runs the decision engine on the current scenario parameters to generate the architecture
  const handleSynthesize = () => {
    setIsGenerating(true);
    setIsSaved(false);
    setTimeout(() => {
      try {
        const result = generateRecommendation(scenario);
        setRecommendation(result);
        setActiveTab("stack");
      } catch (err) {
        console.error("Decision engine failed:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 180);
  };

  // Saves the active architecture recommendation to Neon PostgreSQL
  const handleSaveToDb = async () => {
    if (!recommendation) return;
    setIsSaving(true);
    try {
      const payload = {
        name: scenario.project.name || "Untitled Architecture",
        domain: scenario.project.type || "general",
        architectureStyle: recommendation.architecture_style || "monolith",
        minCost: recommendation.estimated_monthly_cost_usd?.min ?? 0,
        maxCost: recommendation.estimated_monthly_cost_usd?.max ?? 0,
        scenario,
        recommendation,
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

  // Loads a saved architecture from Neon PostgreSQL into the workspace
  const handleLoadSaved = (item: SavedArchitectureItem) => {
    setScenario(item.scenario);
    setRecommendation(item.recommendation);
    setActiveTab("stack");
    setIsSaved(true);
    setIsHistoryOpen(false);
  };

  // Deletes a saved architecture from Neon PostgreSQL
  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved architecture?")) return;
    try {
      const res = await fetch(`/api/architectures?id=${id}`, {
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

  // Resets the scenario form back to the clean blank defaults
  const handleReset = () => {
    setSelectedPresetId(null);
    setScenario(DEFAULT_BLANK_SCENARIO);
    setRecommendation(null);
    setActiveTab("stack");
    setIsSaved(false);
    try {
      sessionStorage.removeItem("stacksense_session");
    } catch (e) {
      // Ignore
    }
  };

  const handleLoadDemo = (key: "fintech" | "saas") => {
    const demo = ENTERPRISE_DEMOS[key];
    setScenario((prev) => ({
      ...prev,
      ...demo,
      project: { ...prev.project, ...(demo.project as any) },
      scale: { ...prev.scale, ...(demo.scale as any) },
      team: { ...prev.team, ...(demo.team as any) },
      budget: { ...prev.budget, ...(demo.budget as any) },
      timeline: { ...prev.timeline, ...(demo.timeline as any) },
      infrastructure: { ...prev.infrastructure, ...(demo.infrastructure as any) },
      requirements: { ...prev.requirements, ...(demo.requirements as any) },
    }));
    setRecommendation(null);
  };

  // Imports a user-uploaded JSON scenario file and validates it before loading
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
      } catch {
        alert("Invalid JSON format. Please upload a valid StackSense configuration file.");
      }
    };
    reader.readAsText(file);
  };

  // Exports the generated recommendation as a downloadable JSON file
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

  // Toggles platforms (Web, Android, iOS, Desktop) on and off
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
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark
          ? "bg-[#09090b] text-zinc-100 selection:bg-zinc-800 selection:text-white"
          : "bg-[#f8fafc] text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900"
      }`}
    >
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
          isDark
            ? "border-zinc-800/70 bg-[#09090b]/80"
            : "border-zinc-200/80 bg-white/80"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1560px] items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                  : "bg-white border-zinc-200 text-zinc-900"
              }`}
            >
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? "text-white" : "text-zinc-950"
                }`}
              >
                StackSense
              </span>
              <span className={isDark ? "text-zinc-600 font-light text-base" : "text-zinc-300 font-light text-base"}>/</span>
              <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Architecture Engine
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5">
            
            {/* Theme Toggle (Dark / Light Mode) */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Reset Parameters */}
            <button
              onClick={handleReset}
              title="Reset parameters to default"
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs sm:text-sm font-medium transition-colors ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Unified Import & Export Button Pair */}
            <div className="flex items-center gap-2 pl-1.5 border-l border-zinc-700/30">
              
              {/* Import Configuration */}
              <label
                title="Import configuration JSON"
                className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 shadow-sm"
                }`}
              >
                <FileUp className="h-4 w-4 text-zinc-400" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Export Blueprint JSON */}
              <button
                onClick={downloadOutputJson}
                disabled={!recommendation}
                title={recommendation ? "Export architecture JSON" : "Generate recommendation to export"}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  recommendation
                    ? isDark
                      ? "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white shadow-sm"
                      : "border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
                    : isDark
                      ? "border-zinc-800/50 bg-zinc-900/20 text-zinc-600 cursor-not-allowed"
                      : "border-zinc-200/60 bg-zinc-100/60 text-zinc-400 cursor-not-allowed"
                }`}
              >
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </button>

              {/* Saved Architectures Trigger */}
              <button
                onClick={() => {
                  fetchSavedArchitectures();
                  setIsHistoryOpen(true);
                }}
                title="View saved architectures from Neon database"
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-xs sm:text-sm font-medium transition-colors ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 shadow-sm"
                }`}
              >
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>Saved</span>
                {savedArchitectures.length > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[11px] font-mono font-semibold ${
                      isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {savedArchitectures.length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1560px] px-6 sm:px-10 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Inputs column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between px-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Scenario Parameters
              </span>
              <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Architecture constraints
              </span>
            </div>

            {/* Project and platforms */}
            <div
              className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-colors ${
                isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? "border-zinc-800/60" : "border-zinc-100"
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Project Scope & Platform
                </span>
                <Globe className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none ${
                      isDark
                        ? "border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                        : "border-zinc-200 bg-zinc-50/70 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
                    }`}
                    placeholder="e.g. Acme Cloud Platform"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
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
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value={2}>2 Weeks (MVP Blitz)</option>
                      <option value={6}>6 Weeks (Fast Track)</option>
                      <option value={12}>12 Weeks (Standard)</option>
                      <option value={24}>24 Weeks (Hardened)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-xs sm:text-[13px] font-medium block mb-1.5 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    Target Platforms
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "web", label: "Web", icon: Globe },
                      { id: "android", label: "Android", icon: Smartphone },
                      { id: "ios", label: "iOS", icon: Smartphone },
                      { id: "desktop", label: "Desktop", icon: Monitor },
                    ].map(({ id, label, icon: Icon }) => {
                      const isSelected = scenario.project.platforms.includes(id as any);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => togglePlatform(id as any)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-[13px] font-medium transition-all ${
                            isSelected
                              ? isDark
                                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                                : "bg-zinc-900 text-white shadow-sm"
                              : isDark
                                ? "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Scale and workload */}
            <div
              className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-colors ${
                isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? "border-zinc-800/60" : "border-zinc-100"
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Scale & Traffic Dynamics
                </span>
                <Sliders className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
              </div>

              <div className="space-y-3.5">
                <div
                  className={`rounded-lg border p-3.5 ${
                    isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className={isDark ? "text-zinc-400" : "text-zinc-600"}>12-Month Target Users</span>
                    <span className={`font-mono font-medium text-sm ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                      {scenario.scale.users_12_months.toLocaleString()} active users
                    </span>
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
                    className="mt-2.5 w-full"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>200 (Seed)</span>
                    <span>50,000 (Growth)</span>
                    <span>300,000+ (Enterprise)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      IO Workload
                    </label>
                    <select
                      value={scenario.scale.workload}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          scale: { ...scenario.scale, workload: e.target.value as any },
                        })
                      }
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value="balanced">Balanced (CRUD)</option>
                      <option value="read_heavy">Read-Heavy (Cacheable)</option>
                      <option value="write_heavy">Write-Heavy (Ingestion)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value="steady">Steady & Predictable</option>
                      <option value="spiky">Spiky Flash Surges</option>
                      <option value="seasonal">Seasonal Bursts</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget and team */}
            <div
              className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-colors ${
                isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? "border-zinc-800/60" : "border-zinc-100"
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Cloud Budget & Team Constraints
                </span>
                <DollarSign className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
              </div>

              <div className="space-y-3.5">
                <div
                  className={`rounded-lg border p-3.5 ${
                    isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-[13px]">
                    <span className={isDark ? "text-zinc-400" : "text-zinc-600"}>Monthly Cloud Budget</span>
                    <span className="font-mono font-medium text-sm text-emerald-500">
                      ${scenario.budget.monthly_infra_usd} / month
                    </span>
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
                    className="mt-2.5 w-full"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-zinc-500 font-mono">
                    <span>$0 (Free Tier)</span>
                    <span>$200 (Starter)</span>
                    <span>$3,000+ (HA / Scaled)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      Team Headcount
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={scenario.team.size}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          team: { ...scenario.team, size: Number(e.target.value) },
                        })
                      }
                      className={`mt-1.5 w-full rounded-lg border px-3.5 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      Seniority Profile
                    </label>
                    <select
                      value={scenario.team.experience}
                      onChange={(e) =>
                        setScenario({
                          ...scenario,
                          team: { ...scenario.team, experience: e.target.value as any },
                        })
                      }
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value="beginner">Beginner (MVP focus)</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="senior">Senior (Distributed)</option>
                      <option value="mixed">Mixed Experience</option>
                    </select>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/50"
                  }`}
                >
                  <div>
                    <div className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                      Dedicated DevOps Engineer
                    </div>
                    <div className="text-xs text-zinc-500">Unlocks self-managed Docker / Kubernetes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={scenario.team.has_devops}
                    onChange={(e) =>
                      setScenario({
                        ...scenario,
                        team: { ...scenario.team, has_devops: e.target.checked },
                      })
                    }
                    className={`h-4 w-4 rounded ${isDark ? "accent-zinc-200" : "accent-zinc-800"}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      Data Residency
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
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value="none">Global / No Restriction</option>
                      <option value="india">India (RBI / DPDP)</option>
                      <option value="eu">European Union (GDPR)</option>
                      <option value="us">United States</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                      className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                          : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                      }`}
                    >
                      <option value="managed_cloud">Managed Cloud (Serverless/PaaS)</option>
                      <option value="self_hosted_cloud_vm">Virtual Machines (IaaS)</option>
                      <option value="on_premise">On-Premise Private Hardware</option>
                      <option value="air_gapped">Air-Gapped (Isolated / Offline)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical capabilities */}
            <div
              className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-colors ${
                isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 mb-3 border-b ${
                  isDark ? "border-zinc-800/60" : "border-zinc-100"
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Technical Capabilities & Requirements
                </span>
                <Shield className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: "realtime", label: "Realtime WebSockets" },
                    { key: "offline_support", label: "Offline-First Sync" },
                    { key: "payments", label: "Payment Gateway" },
                    { key: "full_text_search", label: "Full-Text Search" },
                    { key: "file_media_storage", label: "Object Media Storage" },
                    { key: "seo_critical", label: "SEO Indexing Critical" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs sm:text-[13px] transition-colors ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(scenario.requirements as any)[key]}
                        onChange={(e) =>
                          setScenario({
                            ...scenario,
                            requirements: {
                              ...scenario.requirements,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className={`h-4 w-4 rounded ${isDark ? "accent-zinc-200" : "accent-zinc-800"}`}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
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
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                      isDark
                        ? "border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-zinc-500"
                        : "border-zinc-200 bg-zinc-50/70 text-zinc-900 focus:border-zinc-400"
                    }`}
                  >
                    <option value="none">None (Public Read-Only)</option>
                    <option value="email_password">Email & Password Auth</option>
                    <option value="phone_otp">Phone OTP (SMS Verification)</option>
                    <option value="enterprise_sso">Enterprise SSO (SAML / OIDC)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSynthesize}
              disabled={isGenerating}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ${
                isDark
                  ? "bg-zinc-100 text-zinc-950 hover:bg-white shadow-zinc-950/40"
                  : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/10"
              }`}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>Generating Recommendation...</span>
                </>
              ) : (
                <>
                  <span>Generate Recommendation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Results column */}
          <div className="lg:col-span-7">
            {recommendation ? (
              <div className="space-y-4">
                {/* Results Header */}
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Architecture Synthesis
                  </span>

                  {/* Save to Neon PostgreSQL Button */}
                  <button
                    onClick={handleSaveToDb}
                    disabled={isSaving}
                    title="Save this architecture to database"
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      isSaved
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : isDark
                          ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="h-3.5 w-3.5" />
                        <span>Save Architecture</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  className={`rounded-2xl border p-5 sm:p-6 shadow-sm transition-colors ${
                    isDark
                      ? "border-zinc-800/90 bg-gradient-to-b from-zinc-900/60 to-zinc-950/70"
                      : "border-zinc-200 bg-gradient-to-b from-white to-zinc-50/70 shadow-sm"
                  }`}
                >
                  {/* Top Bar: Style Title + Status Badge + Budget KPI */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
                      isDark ? "border-zinc-800/80" : "border-zinc-200/80"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold tracking-wide uppercase font-mono ${
                            isDark
                              ? "border-zinc-700 bg-zinc-800/90 text-zinc-100"
                              : "border-zinc-300 bg-zinc-100 text-zinc-900 shadow-xs"
                          }`}
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <span>{recommendation.architecture_style.replace(/_/g, " ")} ARCHITECTURE</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                            recommendation.status === "ok"
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {recommendation.status === "ok" ? "Architecturally Sound" : "Feasible With Warnings"}
                        </span>
                      </div>

                      <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-950"}`}>
                        {scenario.project.name || "System"} Architectural Blueprint
                      </h2>
                    </div>

                    {/* Cost KPI Box */}
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-2.5 sm:px-4 sm:py-2.5 ${
                        isDark ? "border-zinc-800/90 bg-zinc-950/80" : "border-zinc-200 bg-zinc-50 shadow-inner"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                          ${recommendation.estimated_monthly_cost_usd.min} - ${recommendation.estimated_monthly_cost_usd.max}
                          <span className="text-xs text-zinc-400 font-sans font-normal"> / mo</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-medium">Estimated Cloud Spend</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Why This Was Chosen */}
                  <div className="mt-4 space-y-3.5">
                    <div
                      className={`rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                        isDark
                          ? "border-zinc-800/80 bg-zinc-900/30 text-zinc-300"
                          : "border-zinc-200/90 bg-white text-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className={`font-semibold mb-1 text-xs uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                            Why this architecture was chosen:
                          </div>
                          <p>{recommendation.summary}</p>
                        </div>
                      </div>
                    </div>

                    {/* 4 Architectural Constraint Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div
                        className={`rounded-xl border p-2.5 text-center sm:text-left ${
                          isDark ? "border-zinc-800/70 bg-zinc-950/40" : "border-zinc-200/80 bg-zinc-50/70"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Target Scale</div>
                        <div className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                          {scenario.scale.users_12_months.toLocaleString()} Users
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border p-2.5 text-center sm:text-left ${
                          isDark ? "border-zinc-800/70 bg-zinc-950/40" : "border-zinc-200/80 bg-zinc-50/70"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Workload Pattern</div>
                        <div className={`text-xs sm:text-sm font-bold mt-0.5 truncate capitalize ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                          {scenario.scale.workload.replace(/_/g, " ")}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border p-2.5 text-center sm:text-left ${
                          isDark ? "border-zinc-800/70 bg-zinc-950/40" : "border-zinc-200/80 bg-zinc-50/70"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Deployment Model</div>
                        <div className={`text-xs sm:text-sm font-bold mt-0.5 truncate capitalize ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                          {scenario.infrastructure.deployment_model.replace(/_/g, " ")}
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border p-2.5 text-center sm:text-left ${
                          isDark ? "border-zinc-800/70 bg-zinc-950/40" : "border-zinc-200/80 bg-zinc-50/70"
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Target MVP Blitz</div>
                        <div className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                          {scenario.timeline.mvp_weeks} Weeks
                        </div>
                      </div>
                    </div>

                    {/* Architectural Warnings (if any) */}
                    {recommendation.warnings.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {recommendation.warnings.map((w, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400"
                          >
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold uppercase tracking-wider">{w.code}: </span>
                              <span>{w.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* View tabs */}
                <div
                  className={`flex rounded-xl border p-1 transition-colors ${
                    isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-zinc-100"
                  }`}
                >
                  {[
                    { id: "stack", label: "Core Stack", icon: Layers },
                    { id: "diagram", label: "Architecture Flowchart", icon: Workflow },
                    { id: "tradeoffs", label: "Trade-offs & Alternatives", icon: Scale },
                    { id: "json", label: "JSON Blueprint", icon: FileCode },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-[13px] font-medium transition-all ${
                        activeTab === id
                          ? isDark
                            ? "bg-zinc-800 text-white shadow-sm font-semibold"
                            : "bg-white text-zinc-950 shadow-sm font-semibold"
                          : isDark
                            ? "text-zinc-400 hover:text-zinc-200"
                            : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: Core Stack */}
                {activeTab === "stack" && recommendation.stack && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {[
                        {
                          label: "Frontend Layer",
                          icon: Server,
                          data: recommendation.stack.frontend,
                        },
                        {
                          label: "Backend Layer",
                          icon: Cpu,
                          data: recommendation.stack.backend,
                        },
                        {
                          label: "Database Layer",
                          icon: Database,
                          data: recommendation.stack.database,
                        },
                        {
                          label: "Cloud Hosting Layer",
                          icon: Cloud,
                          data: recommendation.stack.hosting,
                        },
                      ].map(({ label, icon: Icon, data }) => (
                        <div
                          key={label}
                          className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                            isDark
                              ? "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                              : "border-zinc-200 bg-white hover:border-zinc-300 shadow-sm"
                          }`}
                        >
                          <div>
                            {/* Layer Category & Tag */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/40">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                                    isDark
                                      ? "border-zinc-800 bg-zinc-950 text-zinc-300"
                                      : "border-zinc-200 bg-zinc-100 text-zinc-700"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-400">
                                  {label}
                                </span>
                              </div>

                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                <Check className="h-3 w-3" />
                                Selected
                              </span>
                            </div>

                            {/* Chosen Component Name */}
                            <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                              {data.choice}
                            </h3>
                            
                            {/* Justification */}
                            <p className={`mt-1.5 text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                              {data.justification}
                            </p>

                            {/* Driven-by Constraints Chips */}
                            <div className="mt-3.5">
                              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block mb-1.5">
                                Deciding Constraints:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {data.driven_by.map((f, i) => (
                                  <span
                                    key={i}
                                    className={`rounded-md px-2 py-0.5 font-mono text-[10px] ${
                                      isDark
                                        ? "bg-zinc-950 text-zinc-300 border border-zinc-800"
                                        : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                                    }`}
                                  >
                                    {formatDriverTag(f)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Runner-up Section */}
                          {data.alternatives.length > 0 && (
                            <div
                              className={`mt-4 rounded-xl border p-3 text-xs ${
                                isDark
                                  ? "border-zinc-800/80 bg-zinc-950/60"
                                  : "border-zinc-200 bg-zinc-50/80"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-semibold text-zinc-400 text-[11px]">
                                <span>Runner-up:</span>
                                <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>
                                  {data.alternatives[0].choice}
                                </span>
                              </div>
                              <p className="mt-1 text-zinc-500 text-[11px] leading-relaxed">
                                {data.alternatives[0].why_not}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Supporting Add-on Services */}
                    {recommendation.stack.supporting.length > 0 && (
                      <div
                        className={`rounded-2xl border p-5 ${
                          isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Workflow className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isDark ? "text-zinc-300" : "text-zinc-700"
                            }`}
                          >
                            Supporting Infrastructure & Integrations
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {recommendation.stack.supporting.map((s, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-3 ${
                                isDark
                                  ? "border-zinc-800/80 bg-zinc-950/70 text-zinc-200"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-800"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-zinc-500 mb-1">
                                <span>{s.layer}</span>
                                <span className="text-emerald-500 font-semibold">Active</span>
                              </div>
                              <div className="text-xs sm:text-[13px] font-bold">
                                {s.choice}
                              </div>
                              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                                {s.justification}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: System Architecture Flowchart */}
                {activeTab === "diagram" && (
                  <div className="space-y-3">
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs ${
                        isDark ? "border-zinc-800 bg-zinc-900/40 text-zinc-400" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">Topology Flow:</span>
                        <span>Client Application ➔ Global Edge CDN ➔ Services ➔ Database / Storage</span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">Live Mermaid Render</span>
                    </div>

                    <div>
                      {recommendation.mermaid_diagram ? (
                        <MermaidViewer chart={recommendation.mermaid_diagram} isDark={isDark} />
                      ) : (
                        <div className="p-8 text-center text-xs text-zinc-500">
                          No diagram syntax available.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Architectural Decisions & Trade-Offs (Head-to-Head Comparison Matrix) */}
                {activeTab === "tradeoffs" && recommendation.stack && (
                  <div className="space-y-4">
                    {/* Header Banner */}
                    <div
                      className={`rounded-2xl border p-4 sm:p-5 ${
                        isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                        <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                          Decision Matrix & Trade-off Analysis
                        </h3>
                      </div>
                      <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                        Transparent evaluation showing why the chosen technologies won against alternatives based on team skills, scale, budget, and runtime complexity.
                      </p>
                    </div>

                    {/* 4 Head-to-Head Comparison Layers */}
                    <div className="space-y-4">
                      {[
                        { layer: "Frontend Layer", icon: Server, item: recommendation.stack.frontend, altFallback: "Next.js / Remix" },
                        { layer: "Backend Layer", icon: Cpu, item: recommendation.stack.backend, altFallback: "Node.js Express / NestJS" },
                        { layer: "Database Layer", icon: Database, item: recommendation.stack.database, altFallback: "PostgreSQL / MongoDB" },
                        { layer: "Cloud Hosting", icon: Cloud, item: recommendation.stack.hosting, altFallback: "AWS Fargate / Fly.io" },
                      ].map(({ layer, icon: Icon, item, altFallback }, idx) => {
                        const alternative = item.alternatives[0];
                        return (
                          <div
                            key={layer}
                            className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                              isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
                            }`}
                          >
                            {/* Layer Header */}
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                                    isDark ? "border-zinc-700 bg-zinc-800 text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-700"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                                  0{idx + 1} · {layer}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-zinc-500">
                                Decision Verdict: Concluded
                              </span>
                            </div>

                            {/* Dual Side-by-Side Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {/* The Winner Card */}
                              <div
                                className={`rounded-xl border p-4 flex flex-col justify-between ${
                                  isDark
                                    ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                                    : "border-emerald-200 bg-emerald-50/40"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Recommended Choice
                                    </span>
                                    <span className="text-[11px] font-mono text-emerald-500 font-semibold">Rank: #1 Winner</span>
                                  </div>

                                  <h4 className={`text-base font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
                                    {item.choice}
                                  </h4>

                                  <div className="mt-2 text-xs leading-relaxed text-zinc-300">
                                    <span className="font-semibold text-emerald-400">Why it Won: </span>
                                    <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{item.justification}</span>
                                  </div>
                                </div>

                                {/* Decision Drivers */}
                                <div className="mt-3.5 pt-3 border-t border-emerald-500/20">
                                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block mb-1.5">
                                    Key Criteria Satisfied:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {item.driven_by.map((d, i) => (
                                      <span
                                        key={i}
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                                          isDark
                                            ? "bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                                            : "bg-white text-zinc-800 border border-zinc-200"
                                        }`}
                                      >
                                        {formatDriverTag(d)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* The Runner-up Card */}
                              <div
                                className={`rounded-xl border p-4 flex flex-col justify-between ${
                                  isDark
                                    ? "border-zinc-800 bg-zinc-950/60"
                                    : "border-zinc-200 bg-zinc-50/60"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        isDark
                                          ? "border-zinc-700 bg-zinc-800/80 text-zinc-400"
                                          : "border-zinc-200 bg-zinc-100 text-zinc-600"
                                      }`}
                                    >
                                      <XCircle className="h-3 w-3 text-amber-400" />
                                      Evaluated Alternative
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500">Runner-Up</span>
                                  </div>

                                  <h4 className={`text-base font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                    {alternative?.choice || altFallback}
                                  </h4>

                                  <div className="mt-2 text-xs leading-relaxed">
                                    <span className="font-semibold text-amber-400">Why Rejected: </span>
                                    <span className={isDark ? "text-zinc-400" : "text-zinc-600"}>
                                      {alternative?.why_not || "Did not match the tight resource, operational, or budget constraints of this scenario."}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3.5 pt-3 border-t border-zinc-800/50">
                                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block mb-1.5">
                                    Trade-off Verdict:
                                  </span>
                                  <p className="text-[11px] text-zinc-500 italic">
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
                      <div
                        className={`rounded-2xl border p-4 sm:p-5 ${
                          isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className={`h-4 w-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                            System Boundary Assumptions & Operating Constraints
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {recommendation.assumptions.map((asm, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                                isDark
                                  ? "border-zinc-800 bg-zinc-950/70 text-zinc-300"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
                              }`}
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                              <span>{asm}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* JSON tab */}
                {activeTab === "json" && (
                  <div
                    className={`rounded-xl border p-4 ${
                      isDark ? "border-zinc-800/80 bg-zinc-900/40" : "border-zinc-200 bg-white shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-zinc-500">output_recommendation.json</span>
                      <button
                        onClick={downloadOutputJson}
                        className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                          isDark
                            ? "bg-zinc-100 text-zinc-950 hover:bg-white"
                            : "bg-zinc-900 text-white hover:bg-zinc-800"
                        }`}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                    <pre
                      className={`max-h-[480px] overflow-auto rounded-lg border p-3.5 font-mono text-[11px] ${
                        isDark
                          ? "border-zinc-800 bg-zinc-950 text-zinc-300"
                          : "border-zinc-200 bg-zinc-900 text-zinc-100"
                      }`}
                    >
                      {JSON.stringify(recommendation, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div
                className={`flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${
                  isDark
                    ? "border-zinc-800 bg-zinc-900/20"
                    : "border-zinc-200 bg-zinc-50/50"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border mb-4 shadow-sm ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-inner"
                      : "bg-white border-zinc-200 text-zinc-700 shadow-sm"
                  }`}
                >
                  <Workflow className="h-6 w-6" />
                </div>
                
                <h3 className={`text-base sm:text-lg font-semibold tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                  System Architecture Workspace
                </h3>
                
                <p className={`mt-1.5 max-w-sm text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  Configure your product scope and engineering constraints on the left, then click{" "}
                  <span className={`font-medium ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                    Generate Recommendation
                  </span>{" "}
                  to generate a technical stack recommendation and architecture diagram.
                </p>

                {/* Showcase demo templates */}
                <div className="mt-6 w-full max-w-lg space-y-2 text-left">
                  <span
                    className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider block text-center ${
                      isDark ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    Showcase Demo Scenarios
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {DEMO_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPreset(p)}
                        className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                          isDark
                            ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 shadow-sm"
                        }`}
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px] text-blue-500">{p.id}</span>
                            <span className={`font-medium ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>{p.name}</span>
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                            {p.tag}
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs text-zinc-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Deterministic Engine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Constraint Solved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Mermaid Topology</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Saved Architectures Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDark ? "bg-[#111113] border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${
                isDark ? "border-zinc-800/80 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    isDark ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700 shadow-sm"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold">Saved Architectures</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                        isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {savedArchitectures.length} saved
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Saved architecture recommendations in PostgreSQL database
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHistoryOpen(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  isDark
                    ? "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Strictly only saved items from database */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <RotateCcw className="h-6 w-6 animate-spin mb-2" />
                  <span className="text-sm">Loading saved architectures...</span>
                </div>
              ) : savedArchitectures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border mb-3 ${
                      isDark ? "border-zinc-800 bg-zinc-900 text-zinc-500" : "border-zinc-200 bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    <Clock className="h-6 w-6" />
                  </div>
                  <h4 className={`text-sm font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                    No saved architectures found
                  </h4>
                  <p className={`mt-1 text-xs max-w-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Generate an architecture recommendation and click &quot;Save Architecture&quot; to store it here.
                  </p>
                </div>
              ) : (
                savedArchitectures.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      isDark
                        ? "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/80 shadow-sm"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
                          {item.name}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium uppercase ${
                            isDark
                              ? "border-zinc-700 bg-zinc-800 text-zinc-300"
                              : "border-zinc-200 bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {item.architectureStyle.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-medium ${
                            isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {item.domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                        <span className="text-emerald-500 font-semibold">
                          ${item.minCost} - ${item.maxCost}/mo
                        </span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleLoadSaved(item)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          isDark
                            ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                            : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 shadow-sm"
                        }`}
                      >
                        <span>Load</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteSaved(item.id, e)}
                        title="Delete architecture"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                          isDark
                            ? "border-zinc-800 text-zinc-500 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                            : "border-zinc-200 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`flex items-center justify-between border-t px-6 py-3 text-xs ${
                isDark ? "border-zinc-800/80 bg-zinc-900/30 text-zinc-400" : "border-zinc-100 bg-zinc-50/50 text-zinc-500"
              }`}
            >
              <span>Showing database records from Neon PostgreSQL</span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className={`font-medium hover:underline ${isDark ? "text-zinc-300" : "text-zinc-700"}`}
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

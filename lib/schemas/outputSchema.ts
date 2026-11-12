import { z } from "zod";

// 1. Output Status (Section 4)
export const EngineStatusEnum = z.enum([
  "ok",
  "ok_with_warnings",
  "infeasible",
  "invalid_input",
]);

// 2. High-Level Architectural Style
export const ArchitectureStyleEnum = z.enum([
  "static",
  "monolith",
  "modular_monolith",
  "serverless",
  "service_oriented",
  "microservices",
  "hybrid",
  "other",
]);

// 3. Alternative Component Comparison
export const ComponentAlternativeSchema = z.object({
  choice: z.string(),
  why_not: z.string(),
});

// 4. Core Recommended Component (Frontend, Backend, Database, Hosting)
export const ComponentSchema = z.object({
  choice: z.string(),
  justification: z.string(),
  driven_by: z.array(z.string()),
  alternatives: z.array(ComponentAlternativeSchema).min(1, "Must provide at least one alternative"),
  tradeoffs: z.array(z.string()).default([]),
});

// 5. Supporting Component (Cache, Queue, Auth, Storage, etc.)
export const SupportingComponentSchema = z.object({
  layer: z.string(), // e.g. "cache", "queue", "search", "auth", "storage", "realtime"
  choice: z.string(),
  justification: z.string(),
  driven_by: z.array(z.string()),
  alternatives: z.array(ComponentAlternativeSchema).default([]),
  tradeoffs: z.array(z.string()).default([]),
});

// 6. Estimated Monthly Cost Band (FR6)
export const EstimatedMonthlyCostSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  assumptions: z.array(z.string()).default([]),
});

// 7. Warnings for Contradictions or Architectural Risks (FR7)
export const WarningSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string(),
  fields: z.array(z.string()).default([]),
});

// 8. Field-Level Validation Errors
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

// 9. Full Output Recommendation Schema (Section 4)
export const OutputRecommendationSchema = z.object({
  scenario_id: z.string().optional(),
  engine_version: z.string().default("1.0.0"),
  status: EngineStatusEnum,
  summary: z.string(),
  architecture_style: ArchitectureStyleEnum,
  
  stack: z.object({
    frontend: ComponentSchema,
    backend: ComponentSchema,
    database: ComponentSchema,
    hosting: ComponentSchema,
    supporting: z.array(SupportingComponentSchema).default([]),
  }),

  estimated_monthly_cost_usd: EstimatedMonthlyCostSchema,
  warnings: z.array(WarningSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  validation_errors: z.array(ValidationErrorSchema).default([]),

  // Auto-generated Mermaid.js architecture graph syntax
  mermaid_diagram: z.string().optional(),
});

// Infer TypeScript types for our engine functions
export type OutputRecommendation = z.infer<typeof OutputRecommendationSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type SupportingComponent = z.infer<typeof SupportingComponentSchema>;
export type Warning = z.infer<typeof WarningSchema>;
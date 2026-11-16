import { z } from "zod";

export const EngineStatusEnum = z.enum([
  "ok",
  "ok_with_warnings",
  "infeasible",
  "invalid_input",
]);

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

export const ComponentAlternativeSchema = z.object({
  choice: z.string(),
  why_not: z.string(),
});

export const ComponentSchema = z.object({
  choice: z.string(),
  justification: z.string(),
  driven_by: z.array(z.string()),
  alternatives: z.array(ComponentAlternativeSchema).min(1, "Must provide at least one alternative"),
  tradeoffs: z.array(z.string()).default([]),
});

export const SupportingComponentSchema = z.object({
  layer: z.string(),
  choice: z.string(),
  justification: z.string(),
  driven_by: z.array(z.string()),
  alternatives: z.array(ComponentAlternativeSchema).default([]),
  tradeoffs: z.array(z.string()).default([]),
});

export const EstimatedMonthlyCostSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  assumptions: z.array(z.string()).default([]),
});

export const WarningSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string(),
  fields: z.array(z.string()).default([]),
});

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const OutputStackSchema = z.object({
  frontend: ComponentSchema,
  backend: ComponentSchema,
  database: ComponentSchema,
  hosting: ComponentSchema,
  supporting: z.array(SupportingComponentSchema).default([]),
});

export type OutputStack = z.infer<typeof OutputStackSchema>;

export const OutputRecommendationSchema = z.object({
  scenario_id: z.string().optional(),
  engine_version: z.string().default("1.0.0"),
  status: EngineStatusEnum,
  summary: z.string(),
  architecture_style: ArchitectureStyleEnum,
  stack: OutputStackSchema.nullable(),
  estimated_monthly_cost_usd: EstimatedMonthlyCostSchema,
  warnings: z.array(WarningSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  validation_errors: z.array(ValidationErrorSchema).default([]),
  mermaid_diagram: z.string().optional(),
});

export type OutputRecommendation = z.infer<typeof OutputRecommendationSchema>;
export type ValidOutputRecommendation = Omit<OutputRecommendation, "stack"> & { stack: OutputStack };
export type Component = z.infer<typeof ComponentSchema>;
export type SupportingComponent = z.infer<typeof SupportingComponentSchema>;
export type Warning = z.infer<typeof WarningSchema>;
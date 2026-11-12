import {z} from "zod";

// 1. Allowed Project Types
export const ProjectTypeEnum = z.enum([
    "content_site",
    "web_app",
    "saas_b2b",
    "ecommerce",
    "marketplace",
    "social",
    "realtime_collab",
    "fintech",
    "healthtech",
    "data_analytics",
    "iot",
    "ai_ml_product",
    "internal_tool",
    "gaming",
    "api_platform",
    "other",
]);

// 2. Target Platforms
export const PlatformEnum = z.enum(["web", "android", "ios", "desktop", "api_only"]);

// 3. Traffic Pattern & Workload Profile
export const TrafficPatternEnum = z.enum(["steady", "spiky", "seasonal"]);
export const WorkloadEnum = z.enum(["read_heavy", "balanced", "write_heavy"]);

// 4. Team Experience Level
export const ExperienceLevelEnum = z.enum(["beginner", "intermediate", "senior", "mixed"]);

// 5. Infrastructure Constraints
export const CloudPreferenceEnum = z.enum(["any", "aws", "gcp", "azure", "none"]);
export const DeploymentModelEnum = z.enum([
  "managed_cloud",
  "self_hosted_cloud_vm",
  "on_premise",
  "air_gapped",
]);
export const DataResidencyEnum = z.enum(["none", "india", "eu", "us", "other"]);

// 6. Specialized Requirements
export const AuthTypeEnum = z.enum([
  "none",
  "email_password",
  "social",
  "phone_otp",
  "enterprise_sso",
]);
export const MLFeaturesEnum = z.enum(["none", "inference_api", "llm_rag", "training"]);
export const AvailabilityEnum = z.enum(["99", "99.9", "99.95", "99.99"]);

// 7. Regulatory & Compliance Standards
export const ComplianceEnum = z.enum([
  "gdpr",
  "dpdp",
  "hipaa",
  "pci_dss",
  "rbi_localisation",
  "soc2",
  "iso27001",
]);

// 8. Project Priorities (1 to 5 scale, default 3)
export const PrioritySchema = z.object({
  cost: z.number().int().min(1).max(5).default(3),
  time_to_market: z.number().int().min(1).max(5).default(3),
  scalability: z.number().int().min(1).max(5).default(3),
  performance: z.number().int().min(1).max(5).default(3),
  maintainability: z.number().int().min(1).max(5).default(3),
  security: z.number().int().min(1).max(5).default(3),
}).default({
  cost: 3,
  time_to_market: 3,
  scalability: 3,
  performance: 3,
  maintainability: 3,
  security: 3,
});

// 9. Main Input Scenario Schema
export const InputScenarioSchema = z.object({
  scenario_id: z.string().optional(),

  project: z.object({
    name: z.string().optional().default("Untitled Project"),
    type: ProjectTypeEnum,
    description: z.string().optional().default(""),
    platforms: z.array(PlatformEnum).min(1, "At least one platform is required"),
  }),

    scale: z.object({
    users_at_launch: z.number().int().nonnegative("users_at_launch must be >= 0"),
    users_12_months: z.number().int().nonnegative("users_12_months must be >= 0"),
    peak_concurrent_users: z.number().int().nonnegative().optional(),
    traffic_pattern: TrafficPatternEnum.default("steady"),
    workload: WorkloadEnum.default("balanced"),
    data_volume_gb_12_months: z.number().nonnegative().optional().default(1),
  }),

    team: z.object({
    size: z.number().int().min(1, "Team size must be at least 1 engineer"),
    experience: ExperienceLevelEnum,
    languages: z.array(z.string().toLowerCase()),
    has_devops: z.boolean().default(false),
  }),

  budget: z.object({
    monthly_infra_usd: z.number().nonnegative("Monthly infra budget must be >= 0"),
  }),

  timeline: z.object({
    mvp_weeks: z.number().int().min(1, "MVP timeline must be at least 1 week"),
  }),

    infrastructure: z.object({
    cloud_preference: CloudPreferenceEnum.default("any"),
    deployment_model: DeploymentModelEnum.default("managed_cloud"),
    data_residency: DataResidencyEnum.default("none"),
    existing_systems: z.array(z.string()).default([]),
  }).default({
    cloud_preference: "any",
    deployment_model: "managed_cloud",
    data_residency: "none",
    existing_systems: [],
  }),

    requirements: z.object({
    realtime: z.boolean().default(false),
    offline_support: z.boolean().default(false),
    full_text_search: z.boolean().default(false),
    file_media_storage: z.boolean().default(false),
    payments: z.boolean().default(false),
    auth: AuthTypeEnum.default("none"),
    multi_tenant: z.boolean().default(false),
    ml_features: MLFeaturesEnum.default("none"),
    seo_critical: z.boolean().default(false),
    availability: AvailabilityEnum.default("99.9"),
    p95_latency_ms: z.number().int().positive().nullable().optional().default(null),
  }).default({
    realtime: false,
    offline_support: false,
    full_text_search: false,
    file_media_storage: false,
    payments: false,
    auth: "none",
    multi_tenant: false,
    ml_features: "none",
    seo_critical: false,
    availability: "99.9",
    p95_latency_ms: null,
  }),

    compliance: z.array(ComplianceEnum).default([]),
  priorities: PrioritySchema,
});

// Infer TypeScript type automatically from the schema
export type InputScenario = z.infer<typeof InputScenarioSchema>;



import {
  PlatformEnum,
  WorkloadEnum,
  DeploymentModelEnum,
  DataResidencyEnum,
  CloudPreferenceEnum,
  ComplianceEnum,
} from "../schemas/inputSchema";
import { z } from "zod";

type Platform = z.infer<typeof PlatformEnum>;
type Workload = z.infer<typeof WorkloadEnum>;
type DeploymentModel = z.infer<typeof DeploymentModelEnum>;
type DataResidency = z.infer<typeof DataResidencyEnum>;
type CloudPreference = z.infer<typeof CloudPreferenceEnum>;
type Compliance = z.infer<typeof ComplianceEnum>;

// Structure of every technology in our knowledge base
export interface CatalogItem {
  id: string;                      // unique id (e.g. "nextjs", "fastapi")
  name: string;                    // display name (e.g. "Next.js 14+", "FastAPI")
  layer: "frontend" | "backend" | "database" | "hosting" | "supporting";
  sub_category?: string;          // e.g. "cache", "queue", "search", "auth", "storage"
  description: string;
  languages: string[];             // required languages (e.g. ["typescript", "javascript"])
  
  // Hard Constraint Filters
  platforms: Platform[];           // platforms supported
  deployment_models: DeploymentModel[]; // managed_cloud, on_premise, air_gapped
  data_residency_regions: DataResidency[]; // india, eu, us, etc.
  cloud_providers: CloudPreference[];     // aws, gcp, azure, any
  compliance_certified: Compliance[];     // gdpr, dpdp, hipaa, pci_dss, rbi_localisation
  requires_devops: boolean;        // true if requires manual infra/server management
  supports_acid: boolean;          // true if strict multi-record ACID transactions supported
  supports_realtime: boolean;      // native websockets / streaming
  supports_offline: boolean;       // local offline caching / sync capability
  is_deprecated: boolean;          // must be false for recommended items (Section 5.2)

  // Quantified Scoring Metrics (1-10 scale)
  scalability_rating: number;      // 1 (low scale) to 10 (hyper scale)
  time_to_market_rating: number;  // 1 (slow to build) to 10 (rapid MVP)
  cost_rating: number;             // 1 (expensive) to 10 (completely free)
  complexity_rating: number;       // 1 (simple) to 10 (very complex)
  min_monthly_cost_usd: number;    // base monthly price

  // Explainability & Defense (FR5)
  strengths: string[];
  tradeoffs: string[];
}
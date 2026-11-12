import {
  PlatformEnum,
  WorkloadEnum,
  DeploymentModelEnum,
  DataResidencyEnum,
  CloudPreferenceEnum,
  ComplianceEnum,
} from "../schemas/inputSchema";
import { z } from "zod";

export type Platform = z.infer<typeof PlatformEnum>;
export type Workload = z.infer<typeof WorkloadEnum>;
export type DeploymentModel = z.infer<typeof DeploymentModelEnum>;
export type DataResidency = z.infer<typeof DataResidencyEnum>;
export type CloudPreference = z.infer<typeof CloudPreferenceEnum>;
export type Compliance = z.infer<typeof ComplianceEnum>;

/**
 * Standardized interface for every technology in the knowledge base
 */
export interface CatalogItem {
  id: string;
  name: string;
  layer: "frontend" | "backend" | "database" | "hosting" | "supporting";
  sub_category?: string;
  description: string;
  languages: string[];

  // Hard Constraints
  platforms: Platform[];
  deployment_models: DeploymentModel[];
  data_residency_regions: DataResidency[];
  cloud_providers: CloudPreference[];
  compliance_certified: Compliance[];
  requires_devops: boolean;
  supports_acid: boolean;
  supports_realtime: boolean;
  supports_offline: boolean;
  is_deprecated: boolean;

  // Quantified Scoring Metrics (1-10)
  scalability_rating: number;
  time_to_market_rating: number;
  cost_rating: number;
  complexity_rating: number;
  min_monthly_cost_usd: number;

  // Explainability & Defense (FR5)
  strengths: string[];
  tradeoffs: string[];
}

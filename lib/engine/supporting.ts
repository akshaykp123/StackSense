import { InputScenario } from "../schemas/inputSchema";
import { SupportingComponent } from "../schemas/outputSchema";
import { TECH_CATALOG } from "../catalog";

// Selects add-on services based on specific requirements
export function selectSupportingServices(scenario: InputScenario): SupportingComponent[] {
  const supporting: SupportingComponent[] = [];

  // File and media storage
  if (scenario.requirements.file_media_storage) {
    const s3 = TECH_CATALOG.find((t) => t.id === "aws_s3_storage");
    if (s3) {
      supporting.push({
        layer: "storage",
        choice: s3.name,
        justification: "Pre-signed direct S3 uploads allow clients to store media without loading the API server; 11 9s durability guarantees asset safety.",
        driven_by: ["requirements.file_media_storage"],
        alternatives: [{ choice: "Local Disk Storage", why_not: "Unscalable and lost on container restart" }],
        tradeoffs: s3.tradeoffs,
      });
    }
  }

  // Caching and pub/sub
  const needsCache =
    scenario.requirements.realtime ||
    scenario.scale.traffic_pattern === "spiky" ||
    (scenario.scale.peak_concurrent_users && scenario.scale.peak_concurrent_users > 300) ||
    scenario.scale.workload === "read_heavy";

  if (needsCache && scenario.project.type !== "content_site") {
    const redis = TECH_CATALOG.find((t) => t.id === "redis");
    if (redis) {
      supporting.push({
        layer: "cache",
        choice: redis.name,
        justification: "In-memory caching prevents database connection pool exhaustion during spiky traffic and powers low-latency Pub/Sub.",
        driven_by: [
          ...(scenario.requirements.realtime ? ["requirements.realtime"] : []),
          ...(scenario.scale.traffic_pattern === "spiky" ? ["scale.traffic_pattern"] : []),
        ],
        alternatives: [{ choice: "In-process memory cache", why_not: "Cannot be shared across multiple horizontal server instances" }],
        tradeoffs: redis.tradeoffs,
      });
    }
  }

  // Queue and event streaming
  const needsQueue =
    scenario.requirements.payments ||
    scenario.scale.users_12_months >= 100000 ||
    scenario.scale.workload === "write_heavy";

  if (needsQueue && scenario.project.type !== "content_site") {
    const kafka = TECH_CATALOG.find((t) => t.id === "apache_kafka");
    if (kafka) {
      supporting.push({
        layer: "queue",
        choice: kafka.name,
        justification: "Asynchronous event queue decouples payment webhooks and write-heavy ingestion from core API latency.",
        driven_by: [
          ...(scenario.requirements.payments ? ["requirements.payments"] : []),
          ...(scenario.scale.workload === "write_heavy" ? ["scale.workload"] : []),
        ],
        alternatives: [{ choice: "Synchronous HTTP Webhooks", why_not: "Risks dropped transactions on downstream timeouts" }],
        tradeoffs: kafka.tradeoffs,
      });
    }
  }

  // Full-text search
  if (scenario.requirements.full_text_search) {
    const search = TECH_CATALOG.find((t) => t.id === "meilisearch");
    if (search) {
      supporting.push({
        layer: "search",
        choice: search.name,
        justification: "Sub-50ms typo-tolerant search index delivers instant search-as-you-type marketplace discovery.",
        driven_by: ["requirements.full_text_search"],
        alternatives: [{ choice: "SQL LIKE queries", why_not: "Causes full table scans and poor UX on misspelled queries" }],
        tradeoffs: search.tradeoffs,
      });
    }
  }

  // Auth service
  if (scenario.requirements.auth === "phone_otp") {
    const auth = TECH_CATALOG.find((t) => t.id === "firebase_phone_auth");
    if (auth) {
      supporting.push({
        layer: "auth",
        choice: auth.name,
        justification: "Managed phone OTP delivery and session verification compliant with mobile carrier SMS routing standards.",
        driven_by: ["requirements.auth"],
        alternatives: [{ choice: "Custom SMS Gateway + Redis", why_not: "Higher development time and manual telecom compliance" }],
        tradeoffs: auth.tradeoffs,
      });
    }
  }

  // Payments gateway
  if (scenario.requirements.payments) {
    const payments = TECH_CATALOG.find((t) => t.id === "razorpay_gateway");
    if (payments) {
      supporting.push({
        layer: "payments",
        choice: payments.name,
        justification: "Full-stack payment gateway providing native UPI auto-pay, instant settlements, and RBI tokenization compliance.",
        driven_by: ["requirements.payments"],
        alternatives: [{ choice: "Manual Bank Transfers", why_not: "Zero automation and unacceptable drop-off during checkout" }],
        tradeoffs: payments.tradeoffs,
      });
    }
  }

  return supporting;
}

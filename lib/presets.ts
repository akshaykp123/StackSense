import { InputScenario } from "./schemas/inputSchema";

export interface PresetItem {
  id: string;
  name: string;
  tag: string;
  scenario: InputScenario;
}

export const PUBLIC_PRESETS: PresetItem[] = [
  {
    id: "P1",
    name: "DevFolio",
    tag: "Static Jamstack ($0/mo)",
    scenario: {
      "scenario_id": "P1",
      "project": {
            "name": "DevFolio",
            "type": "content_site",
            "description": "Personal portfolio with project pages and a weekly blog. Content written in Markdown by the owner.",
            "platforms": [
                  "web"
            ]
      },
      "scale": {
            "traffic_pattern": "steady",
            "workload": "read_heavy",
            "users_at_launch": 200,
            "users_12_months": 3000,
            "peak_concurrent_users": 50,
            "data_volume_gb_12_months": 1
      },
      "team": {
            "has_devops": false,
            "size": 1,
            "experience": "beginner",
            "languages": [
                  "javascript",
                  "html",
                  "css"
            ]
      },
      "budget": {
            "monthly_infra_usd": 0
      },
      "timeline": {
            "mvp_weeks": 2
      },
      "infrastructure": {
            "cloud_preference": "any",
            "deployment_model": "managed_cloud",
            "data_residency": "none",
            "existing_systems": []
      },
      "requirements": {
            "realtime": false,
            "offline_support": false,
            "full_text_search": false,
            "file_media_storage": false,
            "payments": false,
            "auth": "none",
            "multi_tenant": false,
            "ml_features": "none",
            "seo_critical": true,
            "availability": "99",
            "p95_latency_ms": null
      },
      "compliance": [],
      "priorities": {
            "cost": 5,
            "time_to_market": 4,
            "scalability": 1,
            "performance": 3,
            "maintainability": 3,
            "security": 2
      }
},
  },
  {
    id: "P2",
    name: "FixIt Now",
    tag: "Marketplace (India, $150/mo)",
    scenario: {
      "scenario_id": "P2",
      "project": {
            "name": "FixIt Now",
            "type": "marketplace",
            "description": "Customers book electricians and plumbers in two cities. Providers accept jobs, chat with customers and get paid. Android app for providers, web + Android for customers.",
            "platforms": [
                  "web",
                  "android"
            ]
      },
      "scale": {
            "traffic_pattern": "steady",
            "workload": "balanced",
            "users_at_launch": 2000,
            "users_12_months": 30000,
            "peak_concurrent_users": 800,
            "data_volume_gb_12_months": 50
      },
      "team": {
            "has_devops": false,
            "size": 3,
            "experience": "intermediate",
            "languages": [
                  "javascript",
                  "typescript",
                  "python"
            ]
      },
      "budget": {
            "monthly_infra_usd": 150
      },
      "timeline": {
            "mvp_weeks": 8
      },
      "infrastructure": {
            "cloud_preference": "any",
            "deployment_model": "managed_cloud",
            "data_residency": "india",
            "existing_systems": []
      },
      "requirements": {
            "realtime": true,
            "offline_support": false,
            "full_text_search": true,
            "file_media_storage": true,
            "payments": true,
            "auth": "phone_otp",
            "multi_tenant": false,
            "ml_features": "none",
            "seo_critical": true,
            "availability": "99.9",
            "p95_latency_ms": 500
      },
      "compliance": [
            "dpdp"
      ],
      "priorities": {
            "cost": 4,
            "time_to_market": 5,
            "scalability": 3,
            "performance": 3,
            "maintainability": 3,
            "security": 3
      }
},
  },

  {
    id: "P4",
    name: "QuickCredit",
    tag: "Fintech Banking ($6,000/mo)",
    scenario: {
      "scenario_id": "P4",
      "project": {
            "name": "QuickCredit",
            "type": "fintech",
            "description": "Small personal loans with UPI disbursal and EMI collection. KYC document upload, credit scoring model, double-entry ledger.",
            "platforms": [
                  "android",
                  "ios",
                  "web"
            ]
      },
      "scale": {
            "traffic_pattern": "spiky",
            "workload": "balanced",
            "users_at_launch": 10000,
            "users_12_months": 300000,
            "peak_concurrent_users": 10000,
            "data_volume_gb_12_months": 500
      },
      "team": {
            "has_devops": true,
            "size": 8,
            "experience": "senior",
            "languages": [
                  "java",
                  "kotlin",
                  "typescript"
            ]
      },
      "budget": {
            "monthly_infra_usd": 6000
      },
      "timeline": {
            "mvp_weeks": 16
      },
      "infrastructure": {
            "cloud_preference": "aws",
            "deployment_model": "managed_cloud",
            "data_residency": "india",
            "existing_systems": []
      },
      "requirements": {
            "realtime": false,
            "offline_support": false,
            "full_text_search": false,
            "file_media_storage": true,
            "payments": true,
            "auth": "phone_otp",
            "multi_tenant": false,
            "ml_features": "inference_api",
            "seo_critical": false,
            "availability": "99.95",
            "p95_latency_ms": 300
      },
      "compliance": [
            "rbi_localisation",
            "pci_dss",
            "dpdp",
            "iso27001"
      ],
      "priorities": {
            "cost": 2,
            "time_to_market": 3,
            "scalability": 4,
            "performance": 3,
            "maintainability": 4,
            "security": 5
      }
},
  },
  {
    id: "P5",
    name: "PeopleDesk",
    tag: "Enterprise Internal ($300/mo)",
    scenario: {
      "scenario_id": "P5",
      "project": {
            "name": "PeopleDesk",
            "type": "internal_tool",
            "description": "Leave requests, approvals and laptop/asset assignment for a 1,200-employee company. Used only by employees.",
            "platforms": [
                  "web"
            ]
      },
      "scale": {
            "traffic_pattern": "steady",
            "workload": "read_heavy",
            "users_at_launch": 1200,
            "users_12_months": 1500,
            "peak_concurrent_users": 300,
            "data_volume_gb_12_months": 20
      },
      "team": {
            "has_devops": false,
            "size": 2,
            "experience": "intermediate",
            "languages": [
                  "csharp",
                  "sql",
                  "javascript"
            ]
      },
      "budget": {
            "monthly_infra_usd": 300
      },
      "timeline": {
            "mvp_weeks": 6
      },
      "infrastructure": {
            "cloud_preference": "azure",
            "deployment_model": "managed_cloud",
            "data_residency": "india",
            "existing_systems": [
                  "Microsoft Entra ID (Azure AD)",
                  "On-prem SQL Server 2019",
                  "Microsoft 365"
            ]
      },
      "requirements": {
            "realtime": false,
            "offline_support": false,
            "full_text_search": false,
            "file_media_storage": true,
            "payments": false,
            "auth": "enterprise_sso",
            "multi_tenant": false,
            "ml_features": "none",
            "seo_critical": false,
            "availability": "99.9",
            "p95_latency_ms": 800
      },
      "compliance": [
            "iso27001"
      ],
      "priorities": {
            "cost": 3,
            "time_to_market": 5,
            "scalability": 1,
            "performance": 2,
            "maintainability": 5,
            "security": 4
      }
},
  },
  {
    id: "P6",
    name: "KhetSurvey",
    tag: "Offline AgriTech ($100/mo)",
    scenario: {
      "scenario_id": "P6",
      "project": {
            "name": "KhetSurvey",
            "type": "other",
            "description": "NGO field agents fill crop surveys with GPS-tagged photos in villages with intermittent 2G/3G. Devices are low-end Android phones (2 GB RAM). Data syncs when signal is available.",
            "platforms": [
                  "android"
            ]
      },
      "scale": {
            "traffic_pattern": "spiky",
            "workload": "write_heavy",
            "users_at_launch": 300,
            "users_12_months": 2000,
            "peak_concurrent_users": 200,
            "data_volume_gb_12_months": 100
      },
      "team": {
            "has_devops": false,
            "size": 2,
            "experience": "mixed",
            "languages": [
                  "javascript",
                  "python"
            ]
      },
      "budget": {
            "monthly_infra_usd": 100
      },
      "timeline": {
            "mvp_weeks": 10
      },
      "infrastructure": {
            "cloud_preference": "any",
            "deployment_model": "managed_cloud",
            "data_residency": "india",
            "existing_systems": []
      },
      "requirements": {
            "realtime": false,
            "offline_support": true,
            "full_text_search": false,
            "file_media_storage": true,
            "payments": false,
            "auth": "phone_otp",
            "multi_tenant": false,
            "ml_features": "none",
            "seo_critical": false,
            "availability": "99",
            "p95_latency_ms": null
      },
      "compliance": [
            "dpdp"
      ],
      "priorities": {
            "cost": 5,
            "time_to_market": 4,
            "scalability": 2,
            "performance": 3,
            "maintainability": 4,
            "security": 3
      }
},
  },
];

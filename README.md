# StackSense

StackSense is a deterministic software architecture and technology stack recommendation engine built for the StackSense Challenge at Synergy '26 (IIIT Bangalore). It evaluates project constraints—such as user scale, monthly infrastructure budget, team programming languages and experience, latency SLAs, compliance mandates (e.g. RBI data localization, GDPR, HIPAA), and deployment targets—and generates a production-grade tech stack with architectural justifications, rejected alternatives, cost estimates, conflict warnings, and a Mermaid system diagram.

Developer: Akshay K P  
Repository: https://github.com/akshaykp123/StackSense.git  

---

## System Architecture

```text
                  +-----------------------------------------+
                  |           Input Scenario (JSON)         |
                  +-----------------------------------------+
                                       |
                                       v
                  +-----------------------------------------+
                  |         1. Schema Validation            |
                  |          (lib/schemas/inputSchema.ts)   |
                  +-----------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+-------------------------------------+ +-------------------------------------+
|        2. Conflict Detection        | |       3. Candidate Filtering        |
|      (lib/engine/conflicts.ts)      | |        (lib/engine/filters.ts)      |
| Flags contradictions / warnings     | | Prunes unfeasible catalog items     |
+-------------------------------------+ +-------------------------------------+
                   |                                       |
                   |                                       v
                   |                    +-------------------------------------+
                   |                    |         4. Candidate Scoring        |
                   |                    |         (lib/engine/scorer.ts)      |
                   |                    | Weighted priorities, skills, scale  |
                   |                    +-------------------------------------+
                   |                                       |
                   +-------------------+-------------------+
                                       |
                                       v
                  +-----------------------------------------+
                  |     5. Recommendation Assembler         |
                  |     (lib/engine/decisionEngine.ts)      |
                  | - Core stack (FE, BE, DB, Hosting)      |
                  | - Supporting services (cache/queue/auth)|
                  | - Justifications and trade-offs         |
                  | - Monthly cost band calculation         |
                  | - Mermaid diagram generator             |
                  +-----------------------------------------+
                                       |
                                       v
                  +-----------------------------------------+
                  |      Output Recommendation (JSON)       |
                  |         (lib/schemas/outputSchema.ts)   |
                  +-----------------------------------------+
```

### Module Descriptions and Data Flow

1. **Schema Validation (`lib/schemas/inputSchema.ts`):** Validates incoming JSON scenarios against strict Zod definitions. Catches missing fields or invalid types before processing.
2. **Conflict Detection (`lib/engine/conflicts.ts`):** Identifies contradictory or risky parameters (e.g., zero budget with high scale, or localization mandates without a matching hosting region) and flags them as structured warnings.
3. **Hard Constraint Filtering (`lib/engine/filters.ts`):** Eliminates unfeasible options from the technology catalog based on hard requirements (e.g., pruning non-ACID databases for fintech, eliminating serverless cloud hosting for air-gapped environments, or filtering out SPA frameworks when SEO is critical).
4. **Utility Scoring (`lib/engine/scorer.ts`):** Scores surviving candidates using weighted priority sliders (cost, scalability, time to market, maintainability), team language familiarity bonuses (+35), devops penalties (-40), and scale threshold adjustments.
5. **Supporting Services Selection (`lib/engine/supporting.ts`):** Deterministically attaches auxiliary services (caching, queues, storage, search, payments, auth) when functional requirements call for them.
6. **Recommendation Assembler (`lib/engine/decisionEngine.ts`):** Picks the top candidate for each layer, assigns the runner-up as an alternative with reasons for rejection, computes an estimated monthly cost band, determines overall architecture style, and generates Mermaid diagram syntax.

---

## Technologies Used

* Next.js 16.4.6 (App Router)
* React 19.3.0
* TypeScript 5.x
* Tailwind CSS 4.3.3
* Zod 4.6.7 (Input/output schema validation)
* Mermaid 12.3.0 (Client-side architecture flowchart rendering)
* Lucide React 1.71.0 (Icons)
* Vitest 5.1.0 (Automated test runner)
* tsx 4.19.3 (TypeScript CLI execution)

---

## Prerequisites

* **Node.js:** v20.x or v22.x LTS
* **npm:** v10.x or later
* **Operating System:** Windows, macOS, or Linux

---

## Setup and Local Run Commands

Clone the repository and install dependencies:

```bash
git clone https://github.com/akshaykp123/StackSense.git
cd StackSense/source
npm install --legacy-peer-deps
```

### Run the Web Interface

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. The interface allows configuring all constraints on the left pane and viewing recommendations, trade-offs, JSON outputs, and the Mermaid architecture diagram on the right pane.

### Run Automated Tests

To run the Vitest test suite:

```bash
npm test
```

This executes 6 automated test suites verifying:
* 100% deterministic output across 50 consecutive runs.
* Strict ACID database enforcement for fintech scenarios.
* Air-gapped deployment pruning of public cloud PaaS in favor of on-premise Docker.
* Architectural conflict warning detection for high scale with $0 budget.
* Protection of solo/beginner developers from complex microservices.
* Schema validity across all benchmark presets.

---

## Running Benchmark Scenarios via CLI

To run the benchmark scenarios headlessly from the command line:

```bash
npm run scenarios
```

### What this script does:
1. Reads `stacksense_public_scenarios.json` from the repository root.
2. Validates each scenario against `InputScenarioSchema`.
3. Runs the deterministic decision engine for each scenario (P1 through P6).
4. Writes the resulting formatted JSON files into the `outputs/` directory:
   * `outputs/P1_output.json` (DevFolio: Static Jamstack)
   * `outputs/P2_output.json` (FixIt Now: Serverless React Native + FastAPI + MongoDB)
   * `outputs/P3_output.json` (BoardRoom: Serverless React SPA + Go + PostgreSQL)
   * `outputs/P4_output.json` (QuickCredit: Microservices NestJS + PostgreSQL + AWS ECS Fargate)
   * `outputs/P5_output.json` (PeopleDesk: Serverless React SPA + NestJS + PostgreSQL)
   * `outputs/P6_output.json` (KhetSurvey: Offline-First Mobile + SQLite)
5. Prints execution metrics and summary details to the console.

---

## LLM Usage and Deterministic Mode Policy (Section 5.1 Compliance)

The StackSense recommendation engine is **100% deterministic**. It does not use any LLM API calls (no OpenAI, Anthropic, or Gemini dependencies) to make architectural decisions.

* **Deterministic by design:** All candidate selections, filtering rules, scoring weights, and trade-offs are evaluated purely through TypeScript heuristics and utility mathematics.
* **Zero hallucination:** The same input scenario will always yield the exact same output recommendation across unlimited consecutive runs (verified by `tests/engine.test.ts`).
* **Offline capability:** The entire recommendation pipeline and CLI runner function with zero internet connection and require no API keys or environment variables.

---

## Project Structure

```text
StackSense/
├── outputs/                         # Exported JSON outputs for public benchmarks (P1-P6)
│   ├── P1_output.json
│   ├── ...
│   └── P6_output.json
├── stacksense_public_scenarios.json # Official public benchmark inputs
└── source/                          # Full Next.js application codebase
    ├── app/
    │   ├── api/recommend/route.ts   # POST endpoint running the decision engine
    │   ├── components/
    │   │   └── MermaidViewer.tsx    # Mermaid flowchart renderer with dark/light themes
    │   ├── globals.css              # Global styles and Tailwind imports
    │   ├── layout.tsx               # Root application layout
    │   └── page.tsx                 # Studio UI with two-column workspace and session persistence
    ├── lib/
    │   ├── catalog/                 # 28 production technologies across 5 layers
    │   │   ├── backend.ts
    │   │   ├── database.ts
    │   │   ├── frontend.ts
    │   │   ├── hosting.ts
    │   │   ├── supporting.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── engine/                  # Deterministic decision pipeline
    │   │   ├── conflicts.ts         # Contradiction and edge-case detector
    │   │   ├── decisionEngine.ts    # Main pipeline coordinator
    │   │   ├── diagram.ts           # Mermaid flowchart generator
    │   │   ├── filters.ts           # Hard constraint pruning rules
    │   │   ├── scorer.ts            # Multi-factor utility scorer
    │   │   └── supporting.ts        # Auxiliary service selector
    │   ├── presets.ts               # Public benchmark presets
    │   └── schemas/                 # Zod validation schemas
    │       ├── inputSchema.ts       # Section 3 input contract
    │       └── outputSchema.ts      # Section 4 output contract
    ├── scripts/
    │   └── run_scenarios.ts         # CLI runner for benchmark scenarios
    ├── tests/
    │   └── engine.test.ts           # Vitest test suite
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

## Credits and Third-Party Dependencies

All libraries used in StackSense are standard open-source tools:

* **Next.js & React:** Web application framework and UI rendering (`https://nextjs.org`).
* **TypeScript:** Static type checking (`https://www.typescriptlang.org`).
* **Tailwind CSS:** Utility-first CSS styling (`https://tailwindcss.com`).
* **Zod:** TypeScript-first schema validation with static type inference (`https://zod.dev`).
* **Mermaid.js:** Diagramming and charting tool for rendering architecture flowcharts (`https://mermaid.js.org`).
* **Lucide React:** Icons for user interface navigation (`https://lucide.dev`).
* **Vitest:** Fast unit and integration test framework (`https://vitest.dev`).
* **tsx:** Node.js enhanced for TypeScript execution without precompilation (`https://github.com/privatenumber/tsx`).

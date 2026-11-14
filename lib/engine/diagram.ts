import { SupportingComponent } from "../schemas/outputSchema";

// Generates Mermaid syntax for the architecture flowchart
export function generateMermaidDiagram(
  frontend: string,
  backend: string,
  database: string,
  hosting: string,
  supporting: SupportingComponent[]
): string {
  let diagram = "flowchart LR\n";
  diagram += `  Client["Users / Clients"] --> FE["Frontend: ${frontend}"]\n`;

  if (backend !== "None (Static / Serverless Forms)") {
    diagram += `  FE --> BE["Backend: ${backend}"]\n`;
    diagram += `  BE --> DB[("Database: ${database}")]\n`;
  } else {
    diagram += `  FE -.-> StaticCDN["Global Edge CDN: ${hosting}"]\n`;
  }

  supporting.forEach((s, idx) => {
    diagram += `  BE -.-> S${idx}["${s.layer.toUpperCase()}: ${s.choice}"]\n`;
  });

  diagram += `  classDef default fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;`;
  return diagram;
}

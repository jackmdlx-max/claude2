/**
 * A curated set of canonical themes for the capital business. Using a fixed
 * taxonomy (rather than free-text) is what lets ideas group cleanly so people
 * can spot duplicates — e.g. several "optioneering in wastewater treatment
 * design" ideas all land under one theme. The engine classifies into one of
 * these; `theme_detail` carries the finer, idea-specific descriptor.
 */
export const THEMES = [
  "Optioneering & options appraisal",
  "Process & treatment design",
  "MEICA, electrical & ICA design",
  "Civil & structural design",
  "Design automation & standard products",
  "Cost estimating & commercial",
  "Contractor & supply-chain data",
  "Programme & delivery reporting",
  "Asset data, GIS & surveys",
  "Consents, permits & regulatory",
  "Document control & handover",
  "Health, safety & CDM",
  "Procurement & contracts",
  "Data handling & spreadsheets",
  "Stakeholder & customer comms",
  "Other",
] as const;

export type Theme = (typeof THEMES)[number];

const RULES: Array<[RegExp, Theme]> = [
  [/option(eer|s appraisal|\b)/i, "Optioneering & options appraisal"],
  [/treatment|process design|sludge|aeration|filtration|wastewater|clean water/i, "Process & treatment design"],
  [/electric|meica|\bica\b|scada|telemetry|instrument|control system/i, "MEICA, electrical & ICA design"],
  [/civil|structural|concrete|geotech|earthwork|pipeline design/i, "Civil & structural design"],
  [/standard product|dfma|template design|reusable design/i, "Design automation & standard products"],
  [/cost estimat|estimating|budget|capex|\bboq\b|rates/i, "Cost estimating & commercial"],
  [/contractor|supply.?chain|subcontract|returns/i, "Contractor & supply-chain data"],
  [/programme|delivery report|dashboard|progress|milestone|forecast/i, "Programme & delivery reporting"],
  [/\bgis\b|asset data|survey|lidar|topograph|condition/i, "Asset data, GIS & surveys"],
  [/consent|permit|environment agency|licen[cs]e|planning|regulatory/i, "Consents, permits & regulatory"],
  [/document control|handover|o&m|drawing register|as.?built/i, "Document control & handover"],
  [/\bcdm\b|health.*safety|risk assessment|\bhse\b/i, "Health, safety & CDM"],
  [/procure|tender|framework|contract award/i, "Procurement & contracts"],
  [/spreadsheet|excel|re.?key|copy.*paste|manual data|reformat|collat/i, "Data handling & spreadsheets"],
  [/stakeholder|customer|comms|communication|engagement/i, "Stakeholder & customer comms"],
];

/** Best-effort theme classification from free text (used by the demo engine). */
export function classifyTheme(text: string): Theme {
  for (const [re, theme] of RULES) {
    if (re.test(text)) return theme;
  }
  return "Data handling & spreadsheets";
}

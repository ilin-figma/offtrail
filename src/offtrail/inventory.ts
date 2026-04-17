/**
 * Offtrail (Figma Make) — photo filter tool: large canvas + right control rail.
 * Not a marketing site; parity target is the Make prototype / your screen recording.
 */

export type ScreenId =
  | "canvas"
  | "presets"
  | "levels"
  | "gradient"
  | "outputLevels"
  | "actions";

export type ComponentGap = "none" | "extend_primitive" | "new_composition";

export const OFFTRAIL_SCREENS: {
  id: ScreenId;
  intent: string;
  sdsPrimitives: string[];
  gap: ComponentGap;
}[] = [
  {
    id: "canvas",
    intent: "Image drop / preview with CLEAR; stylized empty state title.",
    sdsPrimitives: ["Button"],
    gap: "new_composition",
  },
  {
    id: "presets",
    intent: "Three preset slots (01–03) swapping levels + gradient steps.",
    sdsPrimitives: [],
    gap: "new_composition",
  },
  {
    id: "levels",
    intent: "Black / mid / white point sliders.",
    sdsPrimitives: ["Accordion", "AccordionItem", "SliderField"],
    gap: "none",
  },
  {
    id: "gradient",
    intent: "Gradient preview bar, per-step swatch + hex + slider + delete, add step.",
    sdsPrimitives: ["Accordion", "AccordionItem", "SliderField"],
    gap: "new_composition",
  },
  {
    id: "outputLevels",
    intent: "Collapsed/expandable output range (placeholder for full parity).",
    sdsPrimitives: ["Accordion", "AccordionItem"],
    gap: "none",
  },
  {
    id: "actions",
    intent: "RESET + primary DOWNLOAD.",
    sdsPrimitives: [],
    gap: "new_composition",
  },
];

export const OFFTRAIL_REUSABLE_REGIONS = [
  "Logo mark (O + dot grid)",
  "Orange accent for active preset, sliders, and download",
  "Dark charcoal / plum surfaces and hairline borders",
] as const;

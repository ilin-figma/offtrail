import { OFFTRAIL_FIGMA_LOGO } from "offtrail/figmaAssets";
import { IconHelpCircle, IconX } from "icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  SliderField,
} from "primitives";
import "offtrail/offtrail-photo-filter.css";

type PresetId = 1 | 2 | 3;

type LevelsState = {
  blackPoint: number;
  midPoint: number;
  whitePoint: number;
};

/** Output range remap — Figma node 598:281 */
export type OutputLevelsState = {
  outputBlack: number;
  outputWhite: number;
};

export type GradientStep = {
  id: string;
  label: string;
  color: string;
  position: number;
};

const defaultLevels: LevelsState = {
  blackPoint: 135,
  midPoint: 165,
  whitePoint: 136,
};

const defaultSteps: GradientStep[] = [
  {
    id: "s1",
    label: "STEP 01",
    color: "#DADADA",
    position: 8,
  },
  {
    id: "s2",
    label: "STEP 02",
    color: "#555555",
    position: 38,
  },
  {
    id: "s3",
    label: "STEP 03",
    color: "#FFFFFF",
    position: 72,
  },
  {
    id: "s4",
    label: "STEP 04",
    color: "#292929",
    position: 94,
  },
];

const PRESETS: Record<
  PresetId,
  { levels: LevelsState; output: OutputLevelsState; steps: GradientStep[] }
> = {
  1: {
    levels: { blackPoint: 40, midPoint: 120, whitePoint: 220 },
    output: { outputBlack: 0, outputWhite: 216 },
    steps: [
      { id: "p1a", label: "STEP 01", color: "#EEEEEE", position: 15 },
      { id: "p1b", label: "STEP 02", color: "#353535", position: 45 },
      { id: "p1c", label: "STEP 03", color: "#C4C4C4", position: 78 },
    ],
  },
  2: {
    levels: { blackPoint: 90, midPoint: 200, whitePoint: 190 },
    output: { outputBlack: 12, outputWhite: 238 },
    steps: [
      { id: "p2a", label: "STEP 01", color: "#797979", position: 20 },
      { id: "p2b", label: "STEP 02", color: "#555555", position: 50 },
      { id: "p2c", label: "STEP 03", color: "#FFFFFF", position: 80 },
    ],
  },
  3: {
    levels: { ...defaultLevels },
    output: { outputBlack: 0, outputWhite: 255 },
    steps: defaultSteps.map((s) => ({ ...s })),
  },
};

function buildGradientCss(steps: GradientStep[]): string {
  const sorted = [...steps].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return "linear-gradient(90deg, #333, #ccc)";
  const stops = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
  return `linear-gradient(90deg, ${stops})`;
}

function levelsToFilter(levels: LevelsState): string {
  const spread = Math.max(12, levels.whitePoint - levels.blackPoint);
  const contrastPct = Math.min(220, 55 + spread * 0.85);
  const brightness = Math.max(0.35, Math.min(2.4, levels.midPoint / 100));
  return `contrast(${contrastPct}%) brightness(${brightness})`;
}

function outputLevelsToFilter(out: OutputLevelsState): string {
  const span = Math.max(8, out.outputWhite - out.outputBlack);
  const contrastPct = Math.min(200, (255 / span) * 48);
  const lift = (out.outputBlack / 255) * 55;
  const pull = ((255 - out.outputWhite) / 255) * 45;
  const brightnessPct = Math.max(45, Math.min(185, 100 + lift - pull));
  return `contrast(${contrastPct}%) brightness(${brightnessPct}%)`;
}

function previewFilter(levels: LevelsState, output: OutputLevelsState): string {
  return `${levelsToFilter(levels)} ${outputLevelsToFilter(output)}`;
}

let stepId = 0;
function nextStepId() {
  stepId += 1;
  return `step-${stepId}`;
}

function coerceNumber(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 0) : value;
}

export function PhotoFilterApp() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetId>(1);
  const [levels, setLevels] = useState<LevelsState>(() => ({
    ...PRESETS[1].levels,
  }));
  const [outputLevels, setOutputLevels] = useState<OutputLevelsState>(() => ({
    ...PRESETS[1].output,
  }));
  const [steps, setSteps] = useState<GradientStep[]>(() =>
    PRESETS[1].steps.map((s) => ({ ...s })),
  );

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const applyPreset = useCallback((id: PresetId) => {
    setPreset(id);
    const p = PRESETS[id];
    setLevels({ ...p.levels });
    setOutputLevels({ ...p.output });
    setSteps(p.steps.map((s) => ({ ...s })));
  }, []);

  const loadFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      loadFile(input.files?.[0]);
      input.value = "";
    });
    input.click();
  }, [loadFile]);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      loadFile(event.dataTransfer.files[0]);
    },
    [loadFile],
  );

  const onReset = useCallback(() => {
    applyPreset(1);
  }, [applyPreset]);

  const onDownload = useCallback(() => {
    if (!imageSrc) return;
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = "offtrail-photo.png";
    a.rel = "noopener";
    a.click();
  }, [imageSrc]);

  const onClear = useCallback(() => {
    setImageSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const gradientCss = useMemo(() => buildGradientCss(steps), [steps]);

  const updateStep = (id: string, patch: Partial<GradientStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const removeStep = (id: string) => {
    setSteps((prev) => (prev.length <= 2 ? prev : prev.filter((s) => s.id !== id)));
  };

  const addStep = () => {
    setSteps((prev) => {
      if (prev.length >= 8) return prev;
      const n = prev.length + 1;
      return [
        ...prev,
        {
          id: nextStepId(),
          label: `STEP ${String(n).padStart(2, "0")}`,
          color: "#888888",
          position: 50,
        },
      ];
    });
  };

  return (
    <div className="offtrail-photo-filter">
      <section
        className="offtrail-photo-filter__canvas"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {imageSrc ? (
          <>
            <div className="offtrail-photo-filter__clear">
              <Button
                className="offtrail-photo-filter__clear-button"
                variant="neutral"
                size="small"
                onPress={onClear}
              >
                Clear
              </Button>
            </div>
            <div className="offtrail-photo-filter__preview-wrap">
              <div className="offtrail-photo-filter__preview-stack">
                <img
                  alt="Edited preview"
                  className="offtrail-photo-filter__preview"
                  src={imageSrc}
                  style={{
                    filter: previewFilter(levels, outputLevels),
                  }}
                />
                <div
                  aria-hidden
                  className="offtrail-photo-filter__blend"
                  style={{
                    background: gradientCss,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div
            className="offtrail-photo-filter__canvas-inner"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <h1 className="offtrail-photo-filter__title-display">photo filter</h1>
            <p className="offtrail-photo-filter__subtitle">
              drag an image to add photo filter
            </p>
            <div
              className="offtrail-photo-filter__dropzone"
              aria-label="Choose image file"
              onClick={() => openFilePicker()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              role="button"
              tabIndex={0}
            >
              Choose file
            </div>
          </div>
        )}
      </section>

      <aside className="offtrail-photo-filter__sidebar">
        <div className="offtrail-photo-filter__sidebar-brand">
          <img
            alt=""
            className="offtrail-photo-filter__logo-img"
            height={40}
            src={OFFTRAIL_FIGMA_LOGO}
            width={50}
          />
        </div>

        <div className="offtrail-photo-filter__presets" role="tablist" aria-label="Presets">
          {([1, 2, 3] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={preset === id}
              className={
                "offtrail-photo-filter__preset" +
                (preset === id ? " is-active" : "")
              }
              onClick={() => applyPreset(id)}
            >
              {String(id).padStart(2, "0")}
            </button>
          ))}
        </div>

        <div className="offtrail-photo-filter__sidebar-body">
          <Accordion
            className="offtrail-photo-filter__accordion"
            defaultExpandedKeys={new Set(["levels", "gradient"])}
          >
            <AccordionItem id="levels" title="Levels">
              <div className="offtrail-photo-filter__levels-row">
                <SliderField
                  label="BLACK POINT"
                  minValue={0}
                  maxValue={255}
                  step={1}
                  value={levels.blackPoint}
                  onChange={(v) =>
                    setLevels((prev) => ({
                      ...prev,
                      blackPoint: coerceNumber(v),
                    }))
                  }
                  showOutput
                />
              </div>
              <div className="offtrail-photo-filter__levels-row">
                <SliderField
                  label="MID POINT"
                  minValue={50}
                  maxValue={500}
                  step={1}
                  value={levels.midPoint}
                  onChange={(v) =>
                    setLevels((prev) => ({
                      ...prev,
                      midPoint: coerceNumber(v),
                    }))
                  }
                  showOutput
                />
              </div>
              <div className="offtrail-photo-filter__levels-row">
                <SliderField
                  label="WHITE POINT"
                  minValue={0}
                  maxValue={255}
                  step={1}
                  value={levels.whitePoint}
                  onChange={(v) =>
                    setLevels((prev) => ({
                      ...prev,
                      whitePoint: coerceNumber(v),
                    }))
                  }
                  showOutput
                />
              </div>
            </AccordionItem>

            <AccordionItem id="gradient" title="Gradient">
              <div className="offtrail-photo-filter__gradient-bar">
                <div
                  className="offtrail-photo-filter__gradient-bar-fill"
                  style={{ background: gradientCss }}
                />
                <div className="offtrail-photo-filter__gradient-markers">
                  {[...steps]
                    .sort((a, b) => a.position - b.position)
                    .map((s) => (
                      <span
                        key={s.id}
                        className="offtrail-photo-filter__gradient-marker"
                        style={{ left: `${s.position}%` }}
                      />
                    ))}
                </div>
              </div>

              {steps.map((step) => (
                <div key={step.id} className="offtrail-photo-filter__step">
                  <div
                    className="offtrail-photo-filter__swatch"
                    style={{ backgroundColor: step.color }}
                  />
                  <div className="offtrail-photo-filter__step-label">
                    {step.label}
                  </div>
                  <div className="offtrail-photo-filter__step-meta">
                    <input
                      className="offtrail-photo-filter__hex"
                      aria-label={`${step.label} color hex`}
                      value={step.color}
                      onChange={(e) =>
                        updateStep(step.id, { color: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="offtrail-photo-filter__remove"
                      aria-label={`Remove ${step.label}`}
                      disabled={steps.length <= 2}
                      onClick={() => removeStep(step.id)}
                    >
                      <IconX size="16" />
                    </button>
                  </div>
                  <div style={{ gridColumn: "2 / -1" }}>
                    <SliderField
                      aria-label={`${step.label} position`}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      value={step.position}
                      onChange={(v) =>
                        updateStep(step.id, { position: coerceNumber(v) })
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="offtrail-photo-filter__add-step"
                onClick={addStep}
              >
                ADD STEP +
              </button>
            </AccordionItem>

            <AccordionItem id="output" title="Output Levels">
              <div className="offtrail-photo-filter__output-rows">
                <div
                  className="offtrail-photo-filter__output-row"
                  style={
                    {
                      "--off-output-fill": `${(outputLevels.outputBlack / 255) * 100}%`,
                    } as CSSProperties
                  }
                >
                  <SliderField
                    label="OUTPUT BLACK"
                    minValue={0}
                    maxValue={254}
                    step={1}
                    value={outputLevels.outputBlack}
                    onChange={(v) => {
                      const outputBlack = Math.round(coerceNumber(v));
                      setOutputLevels((prev) => ({
                        outputBlack,
                        outputWhite: Math.max(
                          outputBlack + 1,
                          prev.outputWhite,
                        ),
                      }));
                    }}
                    showOutput
                  />
                </div>
                <div
                  className="offtrail-photo-filter__output-row"
                  style={
                    {
                      "--off-output-fill": `${(outputLevels.outputWhite / 255) * 100}%`,
                    } as CSSProperties
                  }
                >
                  <SliderField
                    label="OUTPUT WHITE"
                    minValue={1}
                    maxValue={255}
                    step={1}
                    value={outputLevels.outputWhite}
                    onChange={(v) => {
                      const outputWhite = Math.max(
                        1,
                        Math.round(coerceNumber(v)),
                      );
                      setOutputLevels((prev) => ({
                        outputBlack: Math.min(prev.outputBlack, outputWhite - 1),
                        outputWhite,
                      }));
                    }}
                    showOutput
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>

          <div className="offtrail-photo-filter__sidebar-actions">
            <button
              type="button"
              className="offtrail-photo-filter__btn-reset"
              onClick={onReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="offtrail-photo-filter__btn-download"
              onClick={onDownload}
              disabled={!imageSrc}
            >
              Download
            </button>
          </div>
        </div>
      </aside>

      <div className="offtrail-photo-filter__help">
        <button type="button" aria-label="Help">
          <IconHelpCircle size="16" />
        </button>
      </div>
    </div>
  );
}

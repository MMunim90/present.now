import React from 'react'
import { ASPECT_OPTIONS, DEFAULT_SETTINGS, getCapabilities } from '../../utils/graph/graphDefaults'
import { PALETTE } from '../../utils/graph/graphTheme'
import { Field, ColorField, NumField, Section, SelectField, TextField, Toggle, MiniButton } from './fields'

export default function GraphStyleEditor({ graph, onChange }) {
  const caps = getCapabilities(graph.chartType)
  const s = graph.settings
  const isFn = caps.family === 'function'
  const set = (patch) => onChange({ ...graph, settings: { ...s, ...patch } })

  // Function graphs store their visible window in `view`; other charts use
  // optional min/max settings (empty = automatic).
  const rangeValue = (axis, bound) => (isFn ? graph.view[`${axis}${bound}`] : s[`${axis}${bound}`])
  const setRange = (axis, bound, v) => {
    if (isFn) {
      if (v === null) return
      const next = { ...graph.view, [`${axis}${bound}`]: v }
      if (next[`${axis}Max`] > next[`${axis}Min`]) onChange({ ...graph, view: next })
    } else {
      set({ [`${axis}${bound}`]: v })
    }
  }
  const valueAxisName = caps.radial ? 'Scale' : caps.xRange ? 'Y axis' : 'Value axis'

  return (
    <>
      {caps.axisLabels && (
        <Section title="Axis labels">
          <TextField label="X-axis label" value={s.xLabel} onChange={(xLabel) => set({ xLabel })} placeholder="e.g. Time (s)" />
          <TextField label="Y-axis label" value={s.yLabel} onChange={(yLabel) => set({ yLabel })} placeholder="e.g. Distance (m)" />
        </Section>
      )}

      <Section title="Display">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Toggle label="Show legend" checked={s.showLegend} onChange={(showLegend) => set({ showLegend })} />
          {caps.grid && <Toggle label="Show grid" checked={s.showGrid} onChange={(showGrid) => set({ showGrid })} />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Font size (px)">
            <NumField ariaLabel="Font size" value={s.fontSize} onChange={(v) => v !== null && v >= 8 && v <= 32 && set({ fontSize: v })} />
          </Field>
          {caps.aspect && (
            <SelectField label="Aspect ratio" value={s.aspectRatio} onChange={(aspectRatio) => set({ aspectRatio })}>
              {ASPECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        <Field label="Background colour">
          <div className="flex items-center gap-2">
            <ColorField value={s.background || '#ffffff'} ariaLabel="Background colour" onChange={(background) => set({ background })} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.background || 'Automatic (follows theme)'}</span>
            {s.background && (
              <MiniButton label="Use automatic background" onClick={() => set({ background: '' })}>
                Reset
              </MiniButton>
            )}
          </div>
        </Field>
      </Section>

      {(caps.lineWidth || caps.pointSize) && (
        <Section title="Lines & points">
          <div className="grid grid-cols-2 gap-2">
            {caps.lineWidth && (
              <Field label="Line thickness">
                <NumField ariaLabel="Line thickness" value={s.lineWidth} onChange={(v) => v !== null && v >= 0.5 && v <= 12 && set({ lineWidth: v })} />
              </Field>
            )}
            {caps.pointSize && (
              <Field label="Point size">
                <NumField ariaLabel="Point size" value={s.pointSize} onChange={(v) => v !== null && v >= 0 && v <= 20 && set({ pointSize: v })} />
              </Field>
            )}
          </div>
        </Section>
      )}

      {(caps.xRange || caps.yRange) && (
        <Section title={isFn ? 'Visible range' : 'Axis range (blank = automatic)'}>
          {caps.xRange && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="X min">
                <NumField allowEmpty={!isFn} ariaLabel="X minimum" value={rangeValue('x', 'Min')} onChange={(v) => setRange('x', 'Min', v)} />
              </Field>
              <Field label="X max">
                <NumField allowEmpty={!isFn} ariaLabel="X maximum" value={rangeValue('x', 'Max')} onChange={(v) => setRange('x', 'Max', v)} />
              </Field>
            </div>
          )}
          {caps.yRange && (
            <div className="grid grid-cols-2 gap-2">
              <Field label={`${valueAxisName} min`}>
                <NumField allowEmpty={!isFn} ariaLabel={`${valueAxisName} minimum`} value={rangeValue('y', 'Min')} onChange={(v) => setRange('y', 'Min', v)} />
              </Field>
              <Field label={`${valueAxisName} max`}>
                <NumField allowEmpty={!isFn} ariaLabel={`${valueAxisName} maximum`} value={rangeValue('y', 'Max')} onChange={(v) => setRange('y', 'Max', v)} />
              </Field>
            </div>
          )}
          {isFn && <p className="text-[11px] text-gray-400">Drag the graph to pan and scroll to zoom while the box is selected. Min must stay below max.</p>}
        </Section>
      )}

      <ColorSection graph={graph} caps={caps} onChange={onChange} />

      <Section title="Reset">
        <MiniButton label="Reset style to defaults" onClick={() => onChange({ ...graph, settings: { ...DEFAULT_SETTINGS, bins: s.bins } })}>
          Reset style to defaults
        </MiniButton>
      </Section>
    </>
  )
}

// Series / slice / function colours in one place.
function ColorSection({ graph, caps, onChange }) {
  if (caps.family === 'function') {
    if (!graph.functions.length) return null
    return (
      <Section title="Function colours">
        <ul className="space-y-1.5">
          {graph.functions.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <ColorField
                value={f.color}
                ariaLabel={`Colour of function ${i + 1}`}
                onChange={(color) => onChange({ ...graph, functions: graph.functions.map((g) => (g.id === f.id ? { ...g, color } : g)) })}
              />
              <span className="truncate font-mono">y = {f.expr || '…'}</span>
            </li>
          ))}
        </ul>
      </Section>
    )
  }

  if (caps.pieLike) {
    const d = graph.datasets[0]
    if (!d || !graph.labels.length) return null
    return (
      <Section title="Slice colours">
        <ul className="space-y-1.5">
          {graph.labels.map((label, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <ColorField
                value={d.sliceColors?.[i] || PALETTE[i % PALETTE.length]}
                ariaLabel={`Colour of ${label || `slice ${i + 1}`}`}
                onChange={(c) => {
                  const next = graph.labels.map((_, j) => (j === i ? c : d.sliceColors?.[j] || PALETTE[j % PALETTE.length]))
                  onChange({ ...graph, datasets: [{ ...d, sliceColors: next }, ...graph.datasets.slice(1)] })
                }}
              />
              <span className="truncate">{label || `Slice ${i + 1}`}</span>
            </li>
          ))}
        </ul>
      </Section>
    )
  }

  if (!graph.datasets.length) return null
  return (
    <Section title="Series colours">
      <ul className="space-y-1.5">
        {graph.datasets.map((d, i) => (
          <li key={d.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <ColorField
              value={d.color}
              ariaLabel={`Colour of ${d.label || `series ${i + 1}`}`}
              onChange={(color) => onChange({ ...graph, datasets: graph.datasets.map((x) => (x.id === d.id ? { ...x, color } : x)) })}
            />
            <span className="truncate">{d.label || `Series ${i + 1}`}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

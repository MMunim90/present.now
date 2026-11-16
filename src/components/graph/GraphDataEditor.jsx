import React, { useState } from 'react'
import { uuid } from '../../utils/ids'
import { compileExpression } from '../../utils/graph/expressionParser'
import { PALETTE } from '../../utils/graph/graphTheme'
import { GRAPH_TYPES, TYPE_INFO, convertGraphType, getCapabilities } from '../../utils/graph/graphDefaults'
import { AddButton, ColorField, Field, MiniButton, NumField, Section, SelectField, TextField, inputCls } from './fields'

const MAX_ROWS = 200
const MAX_SERIES = 10
const uid = () => uuid().slice(0, 8)
const groups = ['Mathematical', 'Statistical', 'Other']

export default function GraphDataEditor({ graph, onChange }) {
  const family = TYPE_INFO[graph.chartType].family
  const caps = getCapabilities(graph.chartType)

  return (
    <>
      <Section title="Graph">
        <SelectField label="Graph type" value={graph.chartType} onChange={(t) => onChange(convertGraphType(graph, t))}>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {GRAPH_TYPES.filter((t) => t.group === g).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <TextField label="Title" value={graph.title} onChange={(title) => onChange({ ...graph, title })} placeholder="Graph title" />
        <TextField label="Subtitle (optional)" value={graph.subtitle} onChange={(subtitle) => onChange({ ...graph, subtitle })} placeholder="Subtitle" />
      </Section>

      {family === 'function' && <FunctionEditor graph={graph} onChange={onChange} />}
      {family === 'category' && <CategoryEditor graph={graph} onChange={onChange} caps={caps} />}
      {family === 'xy' && <XYEditor graph={graph} onChange={onChange} />}
      {family === 'histogram' && <HistogramEditor graph={graph} onChange={onChange} />}
    </>
  )
}

// ---- Mathematical: list of expressions ----------------------------------------
function FunctionEditor({ graph, onChange }) {
  const setFn = (id, patch) => onChange({ ...graph, functions: graph.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)) })
  const add = () =>
    onChange({
      ...graph,
      functions: [...graph.functions, { id: uid(), expr: '', color: PALETTE[graph.functions.length % PALETTE.length], visible: true }],
    })
  const remove = (id) => onChange({ ...graph, functions: graph.functions.filter((f) => f.id !== id) })

  return (
    <Section title="Functions" action={<AddButton onClick={add} disabled={graph.functions.length >= MAX_SERIES}>Add function</AddButton>}>
      {graph.functions.length === 0 && <p className="text-xs text-gray-400">No functions yet. Add one to plot it.</p>}
      <ul className="space-y-2">
        {graph.functions.map((f, i) => {
          const { error } = f.expr.trim() ? compileExpression(f.expr) : { error: null }
          return (
            <li key={f.id}>
              <div className="flex items-center gap-1.5">
                <ColorField value={f.color} ariaLabel={`Colour of function ${i + 1}`} onChange={(color) => setFn(f.id, { color })} />
                <span className="shrink-0 text-xs text-gray-400">y =</span>
                <TextField
                  mono
                  ariaLabel={`Expression ${i + 1}`}
                  value={f.expr}
                  placeholder="e.g. 2x + 3, x^2, sin(x)"
                  onChange={(expr) => setFn(f.id, { expr })}
                  className={error ? '!border-red-400 dark:!border-red-500' : ''}
                />
                <MiniButton label={f.visible ? 'Hide function' : 'Show function'} onClick={() => setFn(f.id, { visible: !f.visible })}>
                  {f.visible ? '●' : '○'}
                </MiniButton>
                <MiniButton label="Remove function" danger onClick={() => remove(f.id)}>
                  ✕
                </MiniButton>
              </div>
              {error && (
                <p role="alert" className="mt-1 pl-9 text-[11px] text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        Use <b>x</b> as the variable. Operators: + − * / ^ and ( ). Functions: sin cos tan asin acos atan sinh cosh tanh sqrt cbrt abs exp ln log (base 10) log2 floor ceil round. Constants: pi, e. Implicit multiplication works (2x, 3(x+1)).
      </p>
    </Section>
  )
}

// ---- Statistical: labels + numeric series -----------------------------------------
function CategoryEditor({ graph, onChange, caps }) {
  const { labels, datasets } = graph
  const mixed = graph.chartType === 'mixed'
  const pie = caps.pieLike

  const setLabel = (i, v) => onChange({ ...graph, labels: labels.map((l, j) => (j === i ? v : l)) })
  const setCell = (si, i, v) =>
    onChange({ ...graph, datasets: datasets.map((d, k) => (k === si ? { ...d, data: d.data.map((x, j) => (j === i ? v : x)) } : d)) })
  const setSeries = (si, patch) => onChange({ ...graph, datasets: datasets.map((d, k) => (k === si ? { ...d, ...patch } : d)) })

  const addRow = () =>
    onChange({
      ...graph,
      labels: [...labels, `Item ${labels.length + 1}`],
      datasets: datasets.map((d) => ({ ...d, data: [...d.data, 0], ...(d.sliceColors ? { sliceColors: [...d.sliceColors, PALETTE[labels.length % PALETTE.length]] } : {}) })),
    })
  const delRow = (i) =>
    onChange({
      ...graph,
      labels: labels.filter((_, j) => j !== i),
      datasets: datasets.map((d) => ({ ...d, data: d.data.filter((_, j) => j !== i), ...(d.sliceColors ? { sliceColors: d.sliceColors.filter((_, j) => j !== i) } : {}) })),
    })
  const addSeries = () => {
    const n = datasets.length
    onChange({
      ...graph,
      datasets: [...datasets, { id: uid(), label: `Series ${n + 1}`, color: PALETTE[n % PALETTE.length], data: labels.map(() => 0), ...(mixed ? { kind: 'bar' } : {}) }],
    })
  }
  const delSeries = (si) => onChange({ ...graph, datasets: datasets.filter((_, k) => k !== si) })
  const setSliceColor = (i, color) => {
    const d = datasets[0]
    const next = labels.map((_, j) => (j === i ? color : d.sliceColors?.[j] || PALETTE[j % PALETTE.length]))
    setSeries(0, { sliceColors: next })
  }

  return (
    <Section
      title="Data"
      action={
        <div className="flex gap-1.5">
          <AddButton onClick={addRow} disabled={labels.length >= MAX_ROWS}>Row</AddButton>
          {!caps.singleSeries && <AddButton onClick={addSeries} disabled={datasets.length >= MAX_SERIES}>Series</AddButton>}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-x-1 border-spacing-y-1 text-xs">
          <thead>
            <tr>
              <th className="min-w-[6rem] text-left text-[11px] font-medium text-gray-400">Label</th>
              {datasets.map((d, si) => (
                <th key={d.id} className="min-w-[7.5rem] align-bottom font-normal">
                  <div className="flex items-center gap-1">
                    {!pie && <ColorField value={d.color} ariaLabel={`Colour of series ${si + 1}`} onChange={(color) => setSeries(si, { color })} />}
                    <TextField ariaLabel={`Name of series ${si + 1}`} value={d.label} onChange={(label) => setSeries(si, { label })} />
                    {!caps.singleSeries && datasets.length > 1 && (
                      <MiniButton label="Remove series" danger onClick={() => delSeries(si)}>
                        ✕
                      </MiniButton>
                    )}
                  </div>
                  {mixed && (
                    <select aria-label={`Type of series ${si + 1}`} value={d.kind || 'bar'} onChange={(e) => setSeries(si, { kind: e.target.value })} className={`${inputCls} mt-1`}>
                      <option value="bar">Bars</option>
                      <option value="line">Line</option>
                    </select>
                  )}
                </th>
              ))}
              <th className="w-0" />
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={i}>
                <td>
                  <TextField ariaLabel={`Label of row ${i + 1}`} value={label} onChange={(v) => setLabel(i, v)} />
                </td>
                {datasets.map((d, si) => (
                  <td key={d.id}>
                    <NumField allowEmpty ariaLabel={`${d.label || 'Series'} value, row ${i + 1}`} value={d.data[i]} onChange={(v) => setCell(si, i, v)} />
                  </td>
                ))}
                <td className="whitespace-nowrap">
                  <div className="flex items-center">
                    {pie && datasets[0] && (
                      <ColorField
                        value={datasets[0].sliceColors?.[i] || PALETTE[i % PALETTE.length]}
                        ariaLabel={`Colour of ${label || `row ${i + 1}`}`}
                        onChange={(c) => setSliceColor(i, c)}
                      />
                    )}
                    <MiniButton label="Delete row" danger onClick={() => delRow(i)}>
                      ✕
                    </MiniButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {labels.length === 0 && <p className="text-xs text-gray-400">No rows yet — add one to start.</p>}
    </Section>
  )
}

// ---- Statistical: scatter / bubble points ------------------------------------------
function XYEditor({ graph, onChange }) {
  const bubble = graph.chartType === 'bubble'
  const { datasets } = graph
  const setSeries = (si, patch) => onChange({ ...graph, datasets: datasets.map((d, k) => (k === si ? { ...d, ...patch } : d)) })
  const setPoint = (si, i, patch) => setSeries(si, { data: datasets[si].data.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  const addPoint = (si) => setSeries(si, { data: [...datasets[si].data, { x: 0, y: 0, r: 8 }] })
  const delPoint = (si, i) => setSeries(si, { data: datasets[si].data.filter((_, j) => j !== i) })
  const addSeries = () => {
    const n = datasets.length
    onChange({ ...graph, datasets: [...datasets, { id: uid(), label: `Series ${n + 1}`, color: PALETTE[n % PALETTE.length], data: [{ x: 0, y: 0, r: 8 }] }] })
  }
  const delSeries = (si) => onChange({ ...graph, datasets: datasets.filter((_, k) => k !== si) })

  return (
    <Section title="Data" action={<AddButton onClick={addSeries} disabled={datasets.length >= MAX_SERIES}>Series</AddButton>}>
      <div className="space-y-3">
        {datasets.map((d, si) => (
          <div key={d.id} className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-1">
              <ColorField value={d.color} ariaLabel={`Colour of series ${si + 1}`} onChange={(color) => setSeries(si, { color })} />
              <TextField ariaLabel={`Name of series ${si + 1}`} value={d.label} onChange={(label) => setSeries(si, { label })} />
              {datasets.length > 1 && (
                <MiniButton label="Remove series" danger onClick={() => delSeries(si)}>
                  ✕
                </MiniButton>
              )}
            </div>
            <table className="w-full border-separate border-spacing-x-1 border-spacing-y-1 text-xs">
              <thead>
                <tr className="text-left text-[11px] font-medium text-gray-400">
                  <th>X</th>
                  <th>Y</th>
                  {bubble && <th>Size</th>}
                  <th className="w-0" />
                </tr>
              </thead>
              <tbody>
                {d.data.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <NumField ariaLabel={`X of point ${i + 1}`} value={p.x} onChange={(v) => v !== null && setPoint(si, i, { x: v })} />
                    </td>
                    <td>
                      <NumField ariaLabel={`Y of point ${i + 1}`} value={p.y} onChange={(v) => v !== null && setPoint(si, i, { y: v })} />
                    </td>
                    {bubble && (
                      <td>
                        <NumField ariaLabel={`Size of point ${i + 1}`} value={p.r} onChange={(v) => v !== null && v > 0 && setPoint(si, i, { r: v })} />
                      </td>
                    )}
                    <td>
                      <MiniButton label="Delete point" danger onClick={() => delPoint(si, i)}>
                        ✕
                      </MiniButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1.5">
              <AddButton onClick={() => addPoint(si)} disabled={d.data.length >= MAX_ROWS}>Point</AddButton>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---- Other: histogram (raw values) --------------------------------------------------
function HistogramEditor({ graph, onChange }) {
  const d = graph.datasets[0]
  // Raw text is local so typing separators/partial numbers is never reformatted.
  const [text, setText] = useState(d.data.join(', '))
  const tokens = text.split(/[\s,;]+/).filter(Boolean)
  const ignored = tokens.filter((t) => !Number.isFinite(Number(t))).length

  const handleText = (value) => {
    setText(value)
    const nums = value
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map(Number)
      .filter(Number.isFinite)
      .slice(0, 5000)
    onChange({ ...graph, datasets: [{ ...d, data: nums }] })
  }

  return (
    <Section title="Data">
      <div className="flex items-center gap-1.5">
        <ColorField value={d.color} ariaLabel="Bar colour" onChange={(color) => onChange({ ...graph, datasets: [{ ...d, color }] })} />
        <TextField ariaLabel="Series name" value={d.label} onChange={(label) => onChange({ ...graph, datasets: [{ ...d, label }] })} />
      </div>
      <Field label="Values (separate with commas, spaces or new lines)">
        <textarea
          value={text}
          onChange={(e) => handleText(e.target.value)}
          rows={5}
          aria-label="Histogram values"
          className="w-full resize-y rounded-md border border-gray-200 bg-white p-2 font-mono text-xs text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </Field>
      <p className="text-[11px] text-gray-400">
        {d.data.length} value{d.data.length === 1 ? '' : 's'}
        {ignored > 0 && ` · ${ignored} entr${ignored === 1 ? 'y' : 'ies'} ignored (not a number)`}
      </p>
      <div className="w-28">
        <Field label="Number of bins">
          <NumField
            ariaLabel="Number of bins"
            value={graph.settings.bins}
            onChange={(v) => v !== null && v >= 1 && v <= 100 && onChange({ ...graph, settings: { ...graph.settings, bins: Math.round(v) } })}
          />
        </Field>
      </div>
    </Section>
  )
}


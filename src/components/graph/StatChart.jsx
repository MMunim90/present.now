import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  PolarAreaController,
  RadarController,
  RadialLinearScale,
  ScatterController,
  SubTitle,
  Title,
  Tooltip,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import { buildChartConfig } from '../../utils/graph/chartConfig'

// Register only what the supported chart types need (keeps the bundle small).
ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  PolarAreaController,
  RadarController,
  RadialLinearScale,
  ScatterController,
  SubTitle,
  Title,
  Tooltip
)

// Paints the chart background so exported PNGs are opaque and themed.
const backgroundPlugin = {
  id: 'pnBackground',
  beforeDraw(chart, _args, opts) {
    const { ctx, width, height } = chart
    ctx.save()
    ctx.fillStyle = opts?.color || '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  },
}
const PLUGINS = [backgroundPlugin] // module-level => stable identity

/**
 * Statistical chart renderer (Chart.js). Lazy-loaded by GraphBox so the
 * charting library is only fetched when a graph is actually on the canvas.
 * Memoised: it re-renders only when the graph model or colours change, not
 * when the box is merely moved/selected.
 */
const StatChart = forwardRef(function StatChart({ graph, colors }, ref) {
  const chartRef = useRef(null)
  const config = useMemo(() => buildChartConfig(graph, colors), [graph, colors])

  useImperativeHandle(
    ref,
    () => ({
      toPNGBlob: () =>
        new Promise((resolve, reject) => {
          const canvas = chartRef.current?.canvas
          if (!canvas) {
            reject(new Error('There is no chart to export yet.'))
            return
          }
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the PNG image.'))), 'image/png')
        }),
    }),
    []
  )

  if (config.empty) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-medium" style={{ color: colors.muted }}>
        {config.empty}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <Chart
        // Re-mount when the chart type changes (also covers indexAxis changes).
        key={graph.chartType}
        ref={chartRef}
        type={config.type}
        data={config.data}
        options={config.options}
        plugins={PLUGINS}
        datasetIdKey="id"
      />
    </div>
  )
})

export default React.memo(StatChart)

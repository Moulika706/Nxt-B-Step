"use client"

import React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"

interface ChartData {
  type: "bar" | "line" | "area" | "pie"
  title?: string
  data: Array<{ name: string; value: number; [key: string]: any }>
  colors?: string[]
  xAxisLabel?: string
  yAxisLabel?: string
}

interface ChartRendererProps {
  chartData: ChartData
}

// Beautiful color palettes for charts
const colorPalettes = {
  default: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
  warm: ["#F97316", "#EF4444", "#F59E0B", "#FBBF24", "#FB923C", "#FCA5A5"],
  cool: ["#06B6D4", "#3B82F6", "#8B5CF6", "#10B981", "#6366F1", "#14B8A6"],
  pastel: ["#93C5FD", "#86EFAC", "#FDE68A", "#FCA5A5", "#C4B5FD", "#7DD3FC"],
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData }) => {
  const { type, title, data, colors = colorPalettes.default, xAxisLabel, yAxisLabel } = chartData

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    }

    switch (type) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              fontSize={12}
              label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                color: "#000000",
                fontSize: "12px",
                fontWeight: "500",
                padding: "8px 12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                minWidth: "fit-content",
                whiteSpace: "nowrap",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              labelStyle={{
                color: "#1F2937",
                fontSize: "11px",
                fontWeight: "400",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              itemStyle={{
                color: "#000000",
                fontSize: "12px",
                fontWeight: "600",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              separator=""
            />
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        )

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              fontSize={12}
              label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                color: "#000000",
                fontSize: "12px",
                fontWeight: "500",
                padding: "8px 12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                minWidth: "fit-content",
                whiteSpace: "nowrap",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              labelStyle={{
                color: "#1F2937",
                fontSize: "11px",
                fontWeight: "400",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              itemStyle={{
                color: "#000000",
                fontSize: "12px",
                fontWeight: "600",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              separator=""
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '15px'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        )

      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              fontSize={12}
              label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -10 } : undefined}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft" } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                color: "#000000",
                fontSize: "12px",
                fontWeight: "500",
                padding: "8px 12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                minWidth: "fit-content",
                whiteSpace: "nowrap",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              labelStyle={{
                color: "#1F2937",
                fontSize: "11px",
                fontWeight: "400",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              itemStyle={{
                color: "#000000",
                fontSize: "12px",
                fontWeight: "600",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              separator=""
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '15px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fillOpacity={0.6}
              fill={colors[0]}
              strokeWidth={2}
            />
          </AreaChart>
        )

      case "pie":
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={96}
              fill={colors[0]}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                color: "#000000",
                fontSize: "12px",
                fontWeight: "500",
                padding: "8px 12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                minWidth: "fit-content",
                whiteSpace: "nowrap",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
              labelStyle={{
                color: "#1F2937",
                fontSize: "11px",
                fontWeight: "400",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              itemStyle={{
                color: "#000000",
                fontSize: "12px",
                fontWeight: "600",
                margin: "0",
                padding: "0",
                display: "block",
              }}
              separator=""
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '15px'
              }}
            />
          </PieChart>
        )

      default:
        return <div className="text-red-500">Unsupported chart type: {type}</div>
    }
  }

  return (
    <motion.div
      className="w-full my-6 p-6 bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-xl shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {title && (
        <motion.h3
          className="text-lg font-semibold text-foreground mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {title}
        </motion.h3>
      )}
      <motion.div
        className="w-full h-[360px] md:h-[400px] lg:h-[440px] xl:h-[480px]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  )
}

export default ChartRenderer

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload ?? {};

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px 16px",
      fontSize: "13px",
      color: "#1e293b",
      minWidth: "190px",
    }}>
      <p style={{ fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
        Decile: {label}
      </p>
      <p style={{ margin: "3px 0", color: "#64748b" }}>
        Customers: <strong>{Number(data.customer_count ?? 0).toLocaleString()}</strong>
      </p>
      <p style={{ margin: "3px 0", color: "#0ea5e9" }}>
        Avg PD: <strong>{Number(data.average_pd ?? 0).toFixed(4)}</strong>
      </p>
      <p style={{ margin: "3px 0", color: "#ef4444" }}>
        Actual Bad Rate: <strong>{Number(data.actual_bad_rate ?? 0).toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export default function PDDecileValidationChart({ pdDecileData }) {
  if (!pdDecileData?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart
        data={pdDecileData}
        margin={{ top: 8, right: 40, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

        <XAxis
          dataKey="decile"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          label={{
            value: "Decile",
            position: "insideBottom",
            offset: -2,
            style: { fontSize: 11, fill: "#64748b" },
          }}
        />

        {/* Left Y axis — average PD */}
        <YAxis
          yAxisId="pd"
          orientation="left"
          tick={{ fontSize: 12, fill: "#0ea5e9" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toFixed(2)}
          label={{
            value: "Average PD",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            style: { fontSize: 11, fill: "#0ea5e9" },
          }}
        />

        {/* Right Y axis — bad rate % */}
        <YAxis
          yAxisId="rate"
          orientation="right"
          tick={{ fontSize: 12, fill: "#ef4444" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}%`}
          label={{
            value: "Actual Bad Rate (%)",
            angle: 90,
            position: "insideRight",
            offset: 10,
            style: { fontSize: 11, fill: "#ef4444" },
          }}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span style={{ color: "#475569", fontSize: "13px" }}>{value}</span>
          )}
        />

        <Bar
          yAxisId="pd"
          dataKey="average_pd"
          name="Average PD"
          fill="#0ea5e9"
          opacity={0.85}
          radius={[3, 3, 0, 0]}
          maxBarSize={48}
        />

        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="actual_bad_rate"
          name="Actual Bad Rate (%)"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
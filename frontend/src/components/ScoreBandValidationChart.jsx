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
      minWidth: "200px",
    }}>
      <p style={{ fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
        Score Band: {label}
      </p>
      <p style={{ margin: "3px 0", color: "#6366f1" }}>
        Customers: <strong>{Number(data.customer_count ?? 0).toLocaleString()}</strong>
      </p>
      <p style={{ margin: "3px 0", color: "#64748b" }}>
        Average PD: <strong>{Number(data.average_pd ?? 0).toFixed(4)}</strong>
      </p>
      <p style={{ margin: "3px 0", color: "#64748b" }}>
        PD Range: <strong>{Number(data.min_pd ?? 0).toFixed(4)} – {Number(data.max_pd ?? 0).toFixed(4)}</strong>
      </p>
      <p style={{ margin: "3px 0", color: "#ef4444" }}>
        Actual Bad Rate: <strong>{Number(data.actual_bad_rate ?? 0).toFixed(2)}%</strong>
      </p>
    </div>
  );
};

export default function ScoreBandValidationChart({ scoreBandData }) {
  if (!scoreBandData?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart
        data={scoreBandData}
        margin={{ top: 8, right: 40, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

        <XAxis
          dataKey="score_band"
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
        />

        {/* Left Y axis — customer count */}
        <YAxis
          yAxisId="count"
          orientation="left"
          tick={{ fontSize: 12, fill: "#6366f1" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.toLocaleString()}
          label={{
            value: "Customer Count",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            style: { fontSize: 11, fill: "#6366f1" },
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
          yAxisId="count"
          dataKey="customer_count"
          name="Customer Count"
          fill="#6366f1"
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
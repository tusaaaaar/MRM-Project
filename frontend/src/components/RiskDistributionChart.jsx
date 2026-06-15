import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const COLORS = {
  Good:     "#22c55e",
  Moderate: "#f59e0b",
  Bad:      "#ef4444",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      color: "#1e293b",
    }}>
      {payload.map((entry) => (
        <p key={entry.name} style={{ margin: "2px 0", color: COLORS[entry.name] }}>
          <strong>{entry.name}:</strong> {Number(entry.value).toFixed(1)}%
        </p>
      ))}
    </div>
  );
};

export default function RiskDistributionChart({ segmentSummary }) {
  if (!segmentSummary?.length) return null;

  const getPct = (cat) =>
    segmentSummary.find((s) => s.risk_category === cat)?.percentage ?? 0;

  const chartData = [
    {
      name: "Portfolio",
      Good:     getPct("Good"),
      Moderate: getPct("Moderate"),
      Bad:      getPct("Bad"),
    },
  ];

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
      marginTop: "24px",
    }}>
      <h2 style={{
        fontSize: "20px",
        fontWeight: 600,
        color: "#1e293b",
        marginBottom: "20px",
        marginTop: 0,
      }}>
        Risk Distribution
      </h2>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: "#475569", fontSize: "13px" }}>{value}</span>
            )}
          />

          {["Good", "Moderate", "Bad"].map((key) => (
            <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key]} barSize={40}>
              <LabelList
                dataKey={key}
                position="center"
                style={{ fill: "#ffffff", fontSize: 13, fontWeight: 600 }}
                formatter={(v) => (Number(v) >= 6 ? `${Number(v).toFixed(1)}%` : "")}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
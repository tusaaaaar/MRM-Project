import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
  } from "recharts";
  
  const BUCKETS = [
    { label: "0–10%",   min: 0.00, max: 0.10, color: "#15803d" },
    { label: "10–20%",  min: 0.10, max: 0.20, color: "#22c55e" },
    { label: "20–30%",  min: 0.20, max: 0.30, color: "#86efac" },
    { label: "30–40%",  min: 0.30, max: 0.40, color: "#eab308" },
    { label: "40–50%",  min: 0.40, max: 0.50, color: "#f97316" },
    { label: "50–60%",  min: 0.50, max: 0.60, color: "#fb923c" },
    { label: "60–70%",  min: 0.60, max: 0.70, color: "#ef4444" },
    { label: "70–80%",  min: 0.70, max: 0.80, color: "#dc2626" },
    { label: "80–90%",  min: 0.80, max: 0.90, color: "#b91c1c" },
    { label: "90–100%", min: 0.90, max: 1.00, color: "#7f1d1d" },
  ];
  
  function buildHistogram(pdValues) {
    const counts = Object.fromEntries(BUCKETS.map((b) => [b.label, 0]));
  
    for (const pd of pdValues) {
      const bucket = BUCKETS.find((b) =>
        pd >= b.min && (pd < b.max || (b.max === 1.00 && pd <= 1.00))
      );
      if (bucket) counts[bucket.label]++;
    }
  
    return BUCKETS.map((b) => ({
      range: b.label,
      count: counts[b.label],
      color: b.color,
    }));
  }
  
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: "#1e293b",
        minWidth: "150px",
      }}>
        <p style={{ fontWeight: 700, color: d.color, margin: "0 0 6px" }}>
          PD {d.range}
        </p>
        <p style={{ margin: 0, color: "#64748b" }}>
          Customers:{" "}
          <strong style={{ color: "#1e293b" }}>
            {Number(d.count).toLocaleString()}
          </strong>
        </p>
      </div>
    );
  };
  
  export default function PDDistributionChart({ pdValues }) {
    if (!pdValues?.length) return null;
  
    const chartData = buildHistogram(pdValues);
  
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
          marginTop: 0,
          marginBottom: "20px",
        }}>
          PD Distribution
        </h2>
  
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 24, bottom: 24, left: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
  
            <XAxis
              dataKey="range"
              tick={{ fill: "#64748b", fontSize: 11 }}
              stroke="#cbd5e1"
              interval={0}
              angle={-35}
              textAnchor="end"
              height={52}
              label={{
                value: "PD Range",
                position: "insideBottom",
                offset: -8,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
  
            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              stroke="#cbd5e1"
              tickFormatter={(v) => v.toLocaleString()}
              label={{
                value: "Customer Count",
                angle: -90,
                position: "insideLeft",
                offset: 8,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
  
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
  
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((entry) => (
                <Cell key={entry.range} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
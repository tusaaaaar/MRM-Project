import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";

const BUCKETS = [
  { label: "300–399", rating: "Very Poor",  min: 300, max: 399, color: "#ef4444" },
  { label: "400–499", rating: "Poor",        min: 400, max: 499, color: "#f97316" },
  { label: "500–599", rating: "Fair",        min: 500, max: 599, color: "#eab308" },
  { label: "600–699", rating: "Good",        min: 600, max: 699, color: "#86efac" },
  { label: "700–799", rating: "Very Good",   min: 700, max: 799, color: "#22c55e" },
  { label: "800–899", rating: "Excellent",   min: 800, max: 899, color: "#15803d" },
];

function pdToScore(pd) {
  if (pd <= 0) return 899;
  if (pd >= 1) return 300;
  const odds = (1 - pd) / pd;
  return Math.round(600 + 50 * Math.log2(odds));
}

function buildHistogram(scorecardData) {
  const counts   = Object.fromEntries(BUCKETS.map((b) => [b.label, 0]));
  const defaults = Object.fromEntries(BUCKETS.map((b) => [b.label, 0]));

  for (const row of scorecardData) {
    const pd    = row.probability_of_default;
    const score = pdToScore(pd);
    const bucket = BUCKETS.find((b) => score >= b.min && score <= b.max);
    if (!bucket) continue;
    counts[bucket.label]++;
    if (row.actual_default === 1) defaults[bucket.label]++;
  }

  return BUCKETS.map((b) => {
    const customer_count = counts[b.label];
    const bad_rate = customer_count > 0
      ? (defaults[b.label] / customer_count) * 100
      : 0;
    return {
      range:         b.label,
      rating:        b.rating,
      customer_count,
      bad_rate:      parseFloat(bad_rate.toFixed(2)),
      color:         b.color,
    };
  });
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const hasBadRate = payload.find((p) => p.dataKey === "bad_rate");
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      color: "#1e293b",
      minWidth: "180px",
    }}>
      <p style={{ fontWeight: 700, color: d.color, margin: "0 0 6px" }}>
        {d.rating}
      </p>
      <p style={{ margin: "0 0 2px", color: "#64748b" }}>
        Score Range: <strong style={{ color: "#1e293b" }}>{d.range}</strong>
      </p>
      <p style={{ margin: "0 0 2px", color: "#64748b" }}>
        Customers: <strong style={{ color: "#1e293b" }}>{Number(d.customer_count).toLocaleString()}</strong>
      </p>
      {hasBadRate && (
        <p style={{ margin: 0, color: "#64748b" }}>
          Bad Rate: <strong style={{ color: "#dc2626" }}>{d.bad_rate.toFixed(2)}%</strong>
        </p>
      )}
    </div>
  );
};

function RatingLegend() {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "20px",
    }}>
      {BUCKETS.map((b) => (
        <div key={b.label} style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "999px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "12px",
          fontWeight: 600,
          color: "#1e293b",
        }}>
          <span style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: b.color,
            flexShrink: 0,
          }} />
          <span style={{ color: "#64748b" }}>{b.label}</span>
          <span>{b.rating}</span>
        </div>
      ))}
    </div>
  );
}

const legendFormatter = (value) =>
  value === "customer_count" ? "Customer Count" : "Bad Rate %";

export default function ScoreDistributionChart({ scorecardData }) {
  if (!scorecardData?.length) return null;

  const chartData = buildHistogram(scorecardData);
  const hasActual = scorecardData.some((r) => r.actual_default != null);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
      marginTop: "24px",
    }}>
      <RatingLegend />

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 48, bottom: 24, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

          <XAxis
            dataKey="rating"
            tick={{ fill: "#64748b", fontSize: 12 }}
            stroke="#cbd5e1"
            label={{
              value: "Credit Rating",
              position: "insideBottom",
              offset: -14,
              fill: "#64748b",
              fontSize: 12,
            }}
          />

          {/* Left axis — Customer Count */}
          <YAxis
            yAxisId="count"
            orientation="left"
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

          {/* Right axis — Bad Rate % */}
          {hasActual && (
            <YAxis
              yAxisId="rate"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 12 }}
              stroke="#cbd5e1"
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              label={{
                value: "Bad Rate (%)",
                angle: 90,
                position: "insideRight",
                offset: 12,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />

          <Legend
            formatter={legendFormatter}
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          />

          <Bar
            yAxisId="count"
            dataKey="customer_count"
            name="customer_count"
            radius={[6, 6, 0, 0]}
            maxBarSize={72}
          >
            {chartData.map((entry) => (
              <Cell key={entry.range} fill={entry.color} />
            ))}
          </Bar>

          {hasActual && (
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="bad_rate"
              name="bad_rate"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4, fill: "#dc2626", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
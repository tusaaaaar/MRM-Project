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
      minWidth: "180px",
    }}>
      <p style={{ fontWeight: 700, color: "#2563eb", margin: "0 0 6px" }}>
        {d.column}
      </p>
      <p style={{ margin: "0 0 2px", color: "#64748b" }}>
        Missing Count:{" "}
        <strong style={{ color: "#1e293b" }}>
          {Number(d.missing_count).toLocaleString()}
        </strong>
      </p>
      <p style={{ margin: 0, color: "#64748b" }}>
        Missing %:{" "}
        <strong style={{ color: "#ef4444" }}>
          {Number(d.missing_percentage).toFixed(2)}%
        </strong>
      </p>
    </div>
  );
};

function getBarColor(percentage) {
  if (percentage >= 40) return "#ef4444";
  if (percentage >= 20) return "#f97316";
  if (percentage >= 10) return "#eab308";
  return "#3b82f6";
}

export default function MissingValueAnalysis({ missingValueAnalysis }) {
  const data = missingValueAnalysis ?? [];

  // ── No missing values ────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px",
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#1e293b",
          marginTop: 0,
          marginBottom: "16px",
        }}>
          Missing Value Analysis
        </h2>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "20px 24px",
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "12px",
        }}>
          <span style={{ fontSize: "24px" }}>✓</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#15803d", fontSize: "15px" }}>
              No Missing Values Detected
            </p>
            <p style={{ margin: "4px 0 0", color: "#166534", fontSize: "13px" }}>
              All columns are complete. Dataset passed the missing value check.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalMissing = data.reduce((sum, row) => sum + row.missing_count, 0);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
    }}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <h2 style={{
        fontSize: "20px",
        fontWeight: 600,
        color: "#1e293b",
        marginTop: 0,
        marginBottom: "20px",
      }}>
        Missing Value Analysis
      </h2>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}>
        <div style={{
          flex: 1,
          minWidth: "140px",
          padding: "14px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
        }}>
          <p style={{
            margin: "0 0 4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Columns with Missing Values
          </p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#2563eb" }}>
            {data.length}
          </p>
        </div>

        <div style={{
          flex: 1,
          minWidth: "140px",
          padding: "14px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
        }}>
          <p style={{
            margin: "0 0 4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Total Missing Values
          </p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#ef4444" }}>
            {Number(totalMissing).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", marginBottom: "28px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              {["Column", "Missing Count", "Missing %"].map((h) => (
                <th key={h} style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.column} style={{
                borderBottom: "1px solid #f1f5f9",
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
              }}>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a" }}>
                  {row.column}
                </td>
                <td style={{ padding: "11px 14px", color: "#475569" }}>
                  {Number(row.missing_count).toLocaleString()}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Mini progress bar */}
                    <div style={{
                      width: "80px",
                      height: "6px",
                      background: "#f1f5f9",
                      borderRadius: "999px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}>
                      <div style={{
                        width: `${Math.min(row.missing_percentage, 100)}%`,
                        height: "100%",
                        background: getBarColor(row.missing_percentage),
                        borderRadius: "999px",
                      }} />
                    </div>
                    <span style={{
                      fontWeight: 600,
                      color: getBarColor(row.missing_percentage),
                      fontSize: "13px",
                    }}>
                      {Number(row.missing_percentage).toFixed(2)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bar Chart ─────────────────────────────────────────────────────── */}
      <p style={{
        margin: "0 0 12px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        Missing Count by Column
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 24, bottom: 48, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

          <XAxis
            dataKey="column"
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#cbd5e1"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
            label={{
              value: "Column Name",
              position: "insideBottom",
              offset: -10,
              fill: "#64748b",
              fontSize: 12,
            }}
          />

          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            stroke="#cbd5e1"
            tickFormatter={(v) => v.toLocaleString()}
            label={{
              value: "Missing Count",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              fill: "#64748b",
              fontSize: 12,
            }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />

          <Bar dataKey="missing_count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.column} fill={getBarColor(entry.missing_percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Color Legend ──────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        marginTop: "16px",
        justifyContent: "center",
      }}>
        {[
          { label: "< 10%",  color: "#3b82f6" },
          { label: "10–20%", color: "#eab308" },
          { label: "20–40%", color: "#f97316" },
          { label: "≥ 40%",  color: "#ef4444" },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#64748b",
            fontWeight: 600,
          }}>
            <span style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: item.color,
              flexShrink: 0,
            }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
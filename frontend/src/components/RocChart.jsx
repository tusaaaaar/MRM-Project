// import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// export default function RocChart({ rocData = [], auc }) {
//   const chartData = rocData.map((point) => ({
//     fpr: point.fpr,
//     tpr: point.tpr,
//   }));

//   return (
//     <div style={{ width: "100%", fontFamily: "sans-serif" }}>
//       <h3 style={{ textAlign: "center", marginBottom: "1rem", color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}>
//         ROC Curve (AUC = {auc != null ? Number(auc).toFixed(3) : "—"})
//       </h3>

//       <ResponsiveContainer width="100%" height={300}>
//         <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 24, left: 16 }}>
//           <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

//           <XAxis
//             dataKey="fpr"
//             type="number"
//             domain={[0, 1]}
//             tickCount={6}
//             tickFormatter={(v) => v.toFixed(1)}
//             label={{ value: "False Positive Rate", position: "insideBottom", offset: -12, fill: "#64748b", fontSize: 12 }}
//             tick={{ fill: "#64748b", fontSize: 11 }}
//             stroke="#cbd5e1"
//           />

//           <YAxis
//             dataKey="tpr"
//             type="number"
//             domain={[0, 1]}
//             tickCount={6}
//             tickFormatter={(v) => v.toFixed(1)}
//             label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", offset: 8, fill: "#64748b", fontSize: 12 }}
//             tick={{ fill: "#64748b", fontSize: 11 }}
//             stroke="#cbd5e1"
//           />

//           <Tooltip
//             formatter={(value, name) => [Number(value).toFixed(3), name === "tpr" ? "TPR" : "FPR"]}
//             labelFormatter={(label) => `FPR: ${Number(label).toFixed(3)}`}
//             contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px" }}
//             itemStyle={{ color: "#1e293b" }}
//             labelStyle={{ color: "#64748b", marginBottom: "2px" }}
//           />

//           <Line
//             type="monotone"
//             dataKey="tpr"
//             stroke="#3b82f6"
//             strokeWidth={2}
//             dot={false}
//             activeDot={{ r: 4, fill: "#3b82f6" }}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }


import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function RocChart({ rocData, auc }) {
  if (!rocData?.fpr || !rocData?.tpr) return null;

  const chartData = rocData.fpr.map((value, index) => ({
    fpr: value,
    tpr: rocData.tpr[index],
  }));

  return (
    <div style={{ width: "100%", fontFamily: "sans-serif" }}>
      <h3 style={{ textAlign: "center", marginBottom: "1rem", color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}>
        ROC Curve (AUC = {auc != null ? Number(auc).toFixed(3) : "—"})
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tickCount={6}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "False Positive Rate", position: "insideBottom", offset: -12, fill: "#64748b", fontSize: 12 }}
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#cbd5e1"
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tickCount={6}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", offset: 8, fill: "#64748b", fontSize: 12 }}
            tick={{ fill: "#64748b", fontSize: 11 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            formatter={(value, name) => [Number(value).toFixed(3), name === "tpr" ? "TPR" : "FPR"]}
            labelFormatter={(label) => `FPR: ${Number(label).toFixed(3)}`}
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px" }}
            itemStyle={{ color: "#1e293b" }}
            labelStyle={{ color: "#64748b", marginBottom: "2px" }}
          />
          <Line
            type="monotone"
            dataKey="tpr"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
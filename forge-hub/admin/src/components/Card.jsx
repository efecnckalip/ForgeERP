export default function Card({
  title,
  value,
  subtitle,
  color = "#38bdf8",
}) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid rgba(148,163,184,0.15)",
        borderRadius: 18,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 5,
          height: "100%",
          background: color,
        }}
      />

      <div
        style={{
          color: "#94a3b8",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 34,
          fontWeight: 900,
          color: "#ffffff",
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 8,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
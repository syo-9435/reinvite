const config: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: "下書き",    bg: "#F3EEF4",   color: "#8B7A8E" },
  PUBLISHED: { label: "受付中",    bg: "#6EE7B7",   color: "#1E0A1E" },
  CANCELLED: { label: "キャンセル", bg: "#FCA5A5",   color: "#fff" },
  COMPLETED: { label: "終了",      bg: "#E9D5FF",   color: "#6D28D9" },
  SUSPENDED: { label: "停止中",    bg: "#FEF08A",   color: "#92400E" },
};

export default function EventStatusBadge({ status }: { status: string }) {
  const s = config[status] ?? config.DRAFT;
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 20,
      letterSpacing: 0.5,
      whiteSpace: "nowrap" as const,
    }}>
      {s.label}
    </span>
  );
}

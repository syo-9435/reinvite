const config: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "未確認",     bg: "#FDE68A",   color: "#1E0A1E" },
  ACCEPTED:  { label: "承認済み",   bg: "#6EE7B7",   color: "#1E0A1E" },
  DECLINED:  { label: "不参加",     bg: "#FCA5A5",   color: "#fff" },
  EXPIRED:   { label: "期限切れ",   bg: "#F3EEF4",   color: "#8B7A8E" },
  CANCELLED: { label: "キャンセル", bg: "#F3EEF4",   color: "#8B7A8E" },
};

export default function InvitationStatusBadge({ status }: { status: string }) {
  const s = config[status] ?? config.PENDING;
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

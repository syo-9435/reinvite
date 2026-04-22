"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Admin = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  companyName: string | null;
  groupName: string | null;
  isSuspended: boolean;
  contractStartAt: string | null;
  contractEndAt: string | null;
  createdAt: string;
};

type Tab = "operator" | "inviter";

function contractStatus(admin: Admin): { label: string; color: string } {
  if (!admin.contractEndAt) return { label: "なし", color: "rgba(255,255,255,0.3)" };
  if (new Date(admin.contractEndAt) < new Date()) return { label: "期限切れ", color: "#FF6B9D" };
  return { label: "有効", color: "#4ade80" };
}

function toDateLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP");
}

// ─── 詳細モーダル ────────────────────────────────────────────
function DetailModal({
  admin,
  onClose,
  onSuspend,
  onDelete,
}: {
  admin: Admin;
  onClose: () => void;
  onSuspend: (admin: Admin) => Promise<void>;
  onDelete: (admin: Admin) => Promise<void>;
}) {
  const status = contractStatus(admin);
  const isOperator = admin.role === "ADMIN";

  const rowStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
  };
  const keyStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600,
    letterSpacing: "0.05em", flexShrink: 0, marginRight: 16,
  };
  const valStyle: React.CSSProperties = {
    color: "#fff", fontSize: 13, textAlign: "right", wordBreak: "break-all",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #12091A 0%, #1E0A2A 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: 28, width: "100%", maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* モーダルヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              {admin.name ?? "（名前なし）"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              {isOperator ? "👑 運営アカウント" : "🎫 招待者アカウント"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none",
              borderRadius: 8, color: "rgba(255,255,255,0.5)",
              width: 32, height: 32, fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        {/* 情報行 */}
        <div>
          <div style={rowStyle}>
            <span style={keyStyle}>メールアドレス</span>
            <span style={valStyle}>{admin.email}</span>
          </div>

          {isOperator && (
            <>
              <div style={rowStyle}>
                <span style={keyStyle}>会社名</span>
                <span style={valStyle}>{admin.companyName ?? "—"}</span>
              </div>
              <div style={rowStyle}>
                <span style={keyStyle}>グループ名</span>
                <span style={valStyle}>{admin.groupName ?? "—"}</span>
              </div>
              <div style={rowStyle}>
                <span style={keyStyle}>契約開始日</span>
                <span style={valStyle}>{fmtDate(admin.contractStartAt)}</span>
              </div>
              <div style={rowStyle}>
                <span style={keyStyle}>契約終了日</span>
                <span style={valStyle}>{fmtDate(admin.contractEndAt)}</span>
              </div>
              <div style={rowStyle}>
                <span style={keyStyle}>契約状況</span>
                <span style={{ ...valStyle, color: status.color, fontWeight: 700 }}>● {status.label}</span>
              </div>
            </>
          )}

          <div style={rowStyle}>
            <span style={keyStyle}>登録日</span>
            <span style={valStyle}>{fmtDate(admin.createdAt)}</span>
          </div>

          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={keyStyle}>利用停止状態</span>
            {admin.isSuspended ? (
              <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>停止中</span>
            ) : (
              <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>有効</span>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={async () => { await onSuspend(admin); onClose(); }}
            style={{
              flex: 1,
              background: admin.isSuspended ? "rgba(74,222,128,0.12)" : "rgba(255,107,157,0.12)",
              border: `1px solid ${admin.isSuspended ? "rgba(74,222,128,0.3)" : "rgba(255,107,157,0.3)"}`,
              borderRadius: 10,
              color: admin.isSuspended ? "#4ade80" : "#FF6B9D",
              padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {admin.isSuspended ? "停止解除" : "停止"}
          </button>
          <button
            onClick={async () => { await onDelete(admin); onClose(); }}
            style={{
              flex: 1,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, color: "#f87171",
              padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >削除</button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminClient() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("operator");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", groupName: "", contractStartAt: "", contractEndAt: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editingContract, setEditingContract] = useState<Record<string, { contractStartAt: string; contractEndAt: string }>>({});
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/super-admin/admins");
      if (res.status === 401) { router.refresh(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error ?? `サーバーエラー (${res.status})`);
        return;
      }
      const data = await res.json();
      setAdmins(data.admins);
    } catch {
      setLoadError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function getContractEdit(admin: Admin) {
    return editingContract[admin.id] ?? {
      contractStartAt: toDateLocal(admin.contractStartAt),
      contractEndAt: toDateLocal(admin.contractEndAt),
    };
  }

  async function handleContractSave(adminId: string) {
    const edit = editingContract[adminId];
    if (!edit) return;
    const res = await fetch("/api/super-admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: adminId, contractStartAt: edit.contractStartAt || null, contractEndAt: edit.contractEndAt || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setAdmins(prev => prev.map(a => a.id === adminId ? data.admin : a));
      setEditingContract(prev => { const next = { ...prev }; delete next[adminId]; return next; });
    }
  }

  async function handleSuspend(admin: Admin) {
    const next = !admin.isSuspended;
    const label = next ? "停止" : "停止解除";
    if (!window.confirm(`「${admin.name ?? admin.email}」を${label}しますか？`)) return;

    const res = await fetch("/api/super-admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin.id, isSuspended: next }),
    });
    const data = await res.json();
    if (res.ok) {
      const updated = data.admin as Admin;
      setAdmins(prev => prev.map(a => a.id === admin.id ? updated : a));
      setSelectedAdmin(prev => prev?.id === admin.id ? updated : prev);
    }
  }

  async function handleDelete(admin: Admin) {
    if (!window.confirm(`「${admin.name ?? admin.email}」を削除しますか？\nこの操作は取り消せません。`)) return;

    const res = await fetch("/api/super-admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admin.id }),
    });
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      setSelectedAdmin(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/super-admin/auth", { method: "DELETE" });
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          password: form.password,
          companyName: form.companyName || undefined,
          groupName: form.groupName || undefined,
          contractStartAt: form.contractStartAt || undefined,
          contractEndAt: form.contractEndAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? `作成に失敗しました (${res.status})`);
      } else {
        setAdmins(prev => [data.admin, ...prev]);
        setShowForm(false);
        setForm({ name: "", email: "", password: "", companyName: "", groupName: "", contractStartAt: "", contractEndAt: "" });
      }
    } catch {
      setFormError("通信エラーが発生しました");
    } finally {
      setFormLoading(false);
    }
  }

  const operatorAdmins = admins.filter(a => a.role === "ADMIN");
  const inviterAdmins = admins.filter(a => a.role === "INVITER");

  // ─── スタイル定数 ───────────────────────────────────────────
  const bg = "linear-gradient(160deg, #0A060E 0%, #1E0A1E 100%)";
  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 24,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", color: "rgba(255,255,255,0.5)",
    fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: "0.05em",
  };
  const inlineDateInput: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6, color: "#fff",
    padding: "5px 8px", fontSize: 12, width: "100%", boxSizing: "border-box",
  };
  const thStyle: React.CSSProperties = {
    textAlign: "left", padding: "8px 12px",
    color: "rgba(255,255,255,0.4)", fontWeight: 600,
    fontSize: 11, letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };
  const clickableRowStyle: React.CSSProperties = {
    cursor: "pointer", transition: "background 0.1s",
  };

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "operator", label: "👑 運営アカウント",   count: operatorAdmins.length, color: "#C084FC" },
    { key: "inviter",  label: "🎫 招待者アカウント", count: inviterAdmins.length,  color: "#FF6B9D" },
  ];

  // ─── 共通アクションセル ──────────────────────────────────────
  function ActionButtons({ admin, showSaveButton }: { admin: Admin; showSaveButton?: boolean }) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {showSaveButton && (
          <button onClick={e => { e.stopPropagation(); handleContractSave(admin.id); }} style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            border: "none", borderRadius: 6, color: "#fff",
            padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}>保存</button>
        )}
        <button onClick={e => { e.stopPropagation(); handleSuspend(admin); }} style={{
          background: admin.isSuspended ? "rgba(74,222,128,0.12)" : "rgba(255,107,157,0.12)",
          border: `1px solid ${admin.isSuspended ? "rgba(74,222,128,0.3)" : "rgba(255,107,157,0.3)"}`,
          borderRadius: 6,
          color: admin.isSuspended ? "#4ade80" : "#FF6B9D",
          padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>
          {admin.isSuspended ? "停止解除" : "停止"}
        </button>
        <button onClick={e => { e.stopPropagation(); handleDelete(admin); }} style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 6, color: "#f87171",
          padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>削除</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>🔑 Super Admin</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>adminアカウント管理</p>
          </div>
          <button onClick={handleLogout} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "rgba(255,255,255,0.6)", padding: "8px 16px", fontSize: 13, cursor: "pointer",
          }}>ログアウト</button>
        </div>

        {/* 新規作成ボタン */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setShowForm(v => !v)} style={{
            background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
            border: "none", borderRadius: 10, color: "#fff",
            padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>＋ 新規 admin 作成</button>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>新規 admin アカウント</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>名前（任意）</label>
                  <input style={inputStyle} placeholder="田中 太郎" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>メールアドレス *</label>
                  <input style={inputStyle} type="email" placeholder="admin@example.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>パスワード *</label>
                  <input style={inputStyle} type="password" placeholder="8文字以上" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>会社名（任意）</label>
                  <input style={inputStyle} placeholder="株式会社○○" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>グループ名（任意）</label>
                  <input style={inputStyle} placeholder="○○グループ" value={form.groupName} onChange={e => setForm(f => ({ ...f, groupName: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>契約開始日 *</label>
                  <input style={inputStyle} type="date" required value={form.contractStartAt} onChange={e => setForm(f => ({ ...f, contractStartAt: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>契約終了日 *</label>
                  <input style={inputStyle} type="date" required value={form.contractEndAt} onChange={e => setForm(f => ({ ...f, contractEndAt: e.target.value }))} />
                </div>
              </div>
              {formError && <p style={{ color: "#FF6B9D", fontSize: 13, marginBottom: 12 }}>{formError}</p>}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={formLoading} style={{
                  background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
                  border: "none", borderRadius: 8, color: "#fff",
                  padding: "10px 24px", fontSize: 13, fontWeight: 600,
                  cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1,
                }}>{formLoading ? "作成中..." : "作成"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "rgba(255,255,255,0.6)", padding: "10px 24px", fontSize: 13, cursor: "pointer",
                }}>キャンセル</button>
              </div>
            </form>
          </div>
        )}

        {/* ローディング / エラー */}
        {loading && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>読み込み中...</p>}
        {loadError && <p style={{ color: "#FF6B9D", fontSize: 14 }}>{loadError}</p>}

        {/* タブ + テーブル */}
        {!loading && !loadError && (
          <div style={cardStyle}>
            {/* タブバー */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    background: "none", border: "none",
                    borderBottom: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                    color: isActive ? tab.color : "rgba(255,255,255,0.4)",
                    padding: "10px 18px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {tab.label}
                    <span style={{
                      background: isActive ? `${tab.color}22` : "rgba(255,255,255,0.06)",
                      color: isActive ? tab.color : "rgba(255,255,255,0.3)",
                      borderRadius: 10, padding: "1px 7px", fontSize: 11,
                    }}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {/* 運営アカウントテーブル */}
            {activeTab === "operator" && (
              operatorAdmins.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>運営アカウントがありません</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>名前 / メール</th>
                        <th style={thStyle}>ステータス</th>
                        <th style={thStyle}>契約開始日</th>
                        <th style={thStyle}>契約終了日</th>
                        <th style={thStyle}>契約状況</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {operatorAdmins.map(admin => {
                        const status = contractStatus(admin);
                        const edit = getContractEdit(admin);
                        const isDirty = !!editingContract[admin.id];
                        return (
                          <tr
                            key={admin.id}
                            onClick={() => setSelectedAdmin(admin)}
                            style={clickableRowStyle}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}
                          >
                            <td style={tdStyle}>
                              <div style={{ color: "#fff", fontWeight: 600 }}>{admin.name ?? "—"}</div>
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{admin.email}</div>
                            </td>
                            <td style={tdStyle}>
                              {admin.isSuspended ? (
                                <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>停止中</span>
                              ) : (
                                <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>有効</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, minWidth: 150 }} onClick={e => e.stopPropagation()}>
                              <input type="date" style={inlineDateInput} value={edit.contractStartAt}
                                onChange={e => setEditingContract(prev => ({ ...prev, [admin.id]: { ...getContractEdit(admin), contractStartAt: e.target.value } }))} />
                            </td>
                            <td style={{ ...tdStyle, minWidth: 150 }} onClick={e => e.stopPropagation()}>
                              <input type="date" style={inlineDateInput} value={edit.contractEndAt}
                                onChange={e => setEditingContract(prev => ({ ...prev, [admin.id]: { ...getContractEdit(admin), contractEndAt: e.target.value } }))} />
                            </td>
                            <td style={tdStyle}>
                              <span style={{ color: status.color, fontWeight: 600, fontSize: 12 }}>● {status.label}</span>
                            </td>
                            <td style={tdStyle} onClick={e => e.stopPropagation()}>
                              <ActionButtons admin={admin} showSaveButton={isDirty} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 招待者アカウントテーブル */}
            {activeTab === "inviter" && (
              inviterAdmins.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>招待者アカウントがありません</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>名前 / メール</th>
                        <th style={thStyle}>ステータス</th>
                        <th style={thStyle}>登録日</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inviterAdmins.map(admin => (
                        <tr
                          key={admin.id}
                          onClick={() => setSelectedAdmin(admin)}
                          style={clickableRowStyle}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}
                        >
                          <td style={tdStyle}>
                            <div style={{ color: "#fff", fontWeight: 600 }}>{admin.name ?? "—"}</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{admin.email}</div>
                          </td>
                          <td style={tdStyle}>
                            {admin.isSuspended ? (
                              <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>停止中</span>
                            ) : (
                              <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>有効</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, color: "rgba(255,255,255,0.4)", fontSize: 12, whiteSpace: "nowrap" }}>
                            {new Date(admin.createdAt).toLocaleDateString("ja-JP")}
                          </td>
                          <td style={tdStyle} onClick={e => e.stopPropagation()}>
                            <ActionButtons admin={admin} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}

      </div>

      {/* 詳細モーダル */}
      {selectedAdmin && (
        <DetailModal
          admin={selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
          onSuspend={handleSuspend}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

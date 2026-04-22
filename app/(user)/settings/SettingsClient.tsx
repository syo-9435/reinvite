"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const GENDER_LABELS: Record<string, string> = {
  MALE: "男性", FEMALE: "女性", OTHER: "その他", NO_ANSWER: "回答しない",
};
const AGE_LABELS: Record<string, string> = {
  TEENS: "10代", TWENTIES: "20代", THIRTIES: "30代",
  FORTIES: "40代", FIFTIES_PLUS: "50代以上",
};

const GENDERS = [
  { value: "MALE",      label: "男性" },
  { value: "FEMALE",    label: "女性" },
  { value: "OTHER",     label: "その他" },
  { value: "NO_ANSWER", label: "回答しない" },
];
const AGE_GROUPS = [
  { value: "TEENS",        label: "10代" },
  { value: "TWENTIES",     label: "20代" },
  { value: "THIRTIES",     label: "30代" },
  { value: "FORTIES",      label: "40代" },
  { value: "FIFTIES_PLUS", label: "50代以上" },
];

function ChipGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(selected ? "" : opt.value)}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: `2px solid ${selected ? "#FF6B9D" : "#F3EEF4"}`,
              background: selected ? "#FFF0F6" : "#FFFCFE",
              color: selected ? "#FF6B9D" : "#8B7A8E",
              fontSize: 13, fontWeight: selected ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}

interface Props {
  user: {
    name: string | null;
    email: string;
    hasPassword: boolean;
    gender: string | null;
    ageGroup: string | null;
  };
  lineLinked: boolean;
}

export default function SettingsClient({ user, lineLinked: initialLineLinked }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [lineLinked, setLineLinked] = useState(initialLineLinked);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [linkLoading, setLinkLoading]     = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // プロフィール編集
  const [editingProfile, setEditingProfile] = useState(false);
  const [editGender,   setEditGender]   = useState(user.gender   ?? "");
  const [editAgeGroup, setEditAgeGroup] = useState(user.ageGroup ?? "");
  const [profileGender,   setProfileGender]   = useState(user.gender);
  const [profileAgeGroup, setProfileAgeGroup] = useState(user.ageGroup);
  const [saveLoading, setSaveLoading] = useState(false);

  function startEdit() {
    setEditGender(profileGender   ?? "");
    setEditAgeGroup(profileAgeGroup ?? "");
    setEditingProfile(true);
  }
  function cancelEdit() { setEditingProfile(false); }

  async function saveProfile() {
    setSaveLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender:   editGender   || null,
        ageGroup: editAgeGroup || null,
      }),
    });
    setSaveLoading(false);
    if (res.ok) {
      setProfileGender(editGender || null);
      setProfileAgeGroup(editAgeGroup || null);
      setEditingProfile(false);
      setToast({ msg: "プロフィールを更新しました", type: "success" });
      router.refresh();
    } else {
      const data = await res.json();
      setToast({ msg: data.error ?? "更新に失敗しました", type: "error" });
    }
  }

  // URL パラメータでトースト表示
  useEffect(() => {
    if (params.get("linked") === "line") {
      setLineLinked(true);
      setToast({ msg: "LINEアカウントを連携しました", type: "success" });
      router.replace("/settings");
    }
    if (params.get("error") === "line_already_linked") {
      setToast({ msg: "このLINEアカウントは既に別のアカウントと連携されています", type: "error" });
      router.replace("/settings");
    }
  }, [params, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleLinkLine() {
    setLinkLoading(true);
    try {
      await fetch("/api/user/line/link-init", { method: "POST" });
      await signIn("line", { callbackUrl: "/settings" });
    } catch {
      setLinkLoading(false);
    }
  }

  async function handleUnlinkLine() {
    if (!confirm("LINE連携を解除しますか？")) return;
    setUnlinkLoading(true);
    const res = await fetch("/api/user/line/unlink", { method: "DELETE" });
    setUnlinkLoading(false);
    if (res.ok) {
      setLineLinked(false);
      setToast({ msg: "LINE連携を解除しました", type: "success" });
    } else {
      const data = await res.json();
      setToast({ msg: data.error ?? "解除に失敗しました", type: "error" });
    }
  }

  return (
    <div style={{ background: "#F3EEF4", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <div style={{
        background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
        padding: "24px 24px 32px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, width: 80, height: 80, background: "#fff", top: -20, right: -20 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>マイページ</p>
          <h1 style={{ color: "#fff", fontSize: 22, margin: "4px 0 0", fontWeight: 900 }}>設定</h1>
        </div>
      </div>

      <div style={{ padding: "16px 20px 60px" }}>

        {/* プロフィール */}
        <section style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(255,107,157,0.06)", border: "1.5px solid #FFF0F6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#8B7A8E", margin: 0, letterSpacing: "0.05em" }}>プロフィール</h2>
            {!editingProfile && (
              <button
                onClick={startEdit}
                style={{
                  padding: "5px 14px", borderRadius: 20,
                  border: "1.5px solid #FFB3D0",
                  background: "#FFF0F6", color: "#FF6B9D",
                  fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >編集</button>
            )}
          </div>

          {/* 名前・メール（常に表示） */}
          <dl style={{ margin: "0 0 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "名前",   value: user.name ?? "（未設定）" },
              { label: "メール", value: user.email },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #F3EEF4" }}>
                <dt style={{ fontSize: 13, color: "#8B7A8E" }}>{label}</dt>
                <dd style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E0A1E" }}>{value}</dd>
              </div>
            ))}
          </dl>

          {/* 性別・年代 */}
          {editingProfile ? (
            <div>
              {/* 性別チップ */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#8B7A8E", letterSpacing: "0.05em" }}>性別（任意）</p>
                <ChipGroup options={GENDERS} value={editGender} onChange={setEditGender} />
              </div>
              {/* 年代チップ */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#8B7A8E", letterSpacing: "0.05em" }}>年代（任意）</p>
                <ChipGroup options={AGE_GROUPS} value={editAgeGroup} onChange={setEditAgeGroup} />
              </div>
              {/* 保存・キャンセル */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={saveProfile}
                  disabled={saveLoading}
                  style={{
                    flex: 1, padding: "10px",
                    borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #FF6B9D, #C084FC)",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                    opacity: saveLoading ? 0.7 : 1,
                  }}
                >{saveLoading ? "保存中..." : "保存する"}</button>
                <button
                  onClick={cancelEdit}
                  disabled={saveLoading}
                  style={{
                    flex: 1, padding: "10px",
                    borderRadius: 12, border: "1.5px solid #F3EEF4",
                    background: "#fff", color: "#8B7A8E",
                    fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >キャンセル</button>
              </div>
            </div>
          ) : (
            <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "性別", value: profileGender   ? GENDER_LABELS[profileGender]   : "（未設定）" },
                { label: "年代", value: profileAgeGroup ? AGE_LABELS[profileAgeGroup]     : "（未設定）" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #F3EEF4" }}>
                  <dt style={{ fontSize: 13, color: "#8B7A8E" }}>{label}</dt>
                  <dd style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E0A1E" }}>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* LINE 連携 */}
        <section style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(255,107,157,0.06)", border: "1.5px solid #FFF0F6" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#8B7A8E", margin: "0 0 16px", letterSpacing: "0.05em" }}>LINE 連携</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: lineLinked ? "#00C300" : "#F3EEF4",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              {lineLinked ? "✓" : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={lineLinked ? "#fff" : "#8B7A8E"}>
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.630 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1E0A1E" }}>
                {lineLinked ? "LINE連携済み" : "LINE未連携"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8B7A8E" }}>
                {lineLinked
                  ? "LINEアカウントでログインできます"
                  : "LINEアカウントでログインできるようになります"}
              </p>
            </div>

            {lineLinked ? (
              <button
                onClick={handleUnlinkLine}
                disabled={unlinkLoading || !user.hasPassword}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  border: "1.5px solid #FCA5A5", background: "#fff",
                  color: "#ef4444", fontSize: 12, fontWeight: 700,
                  cursor: user.hasPassword ? "pointer" : "not-allowed",
                  opacity: !user.hasPassword ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
                title={!user.hasPassword ? "パスワードを設定してから解除してください" : ""}
              >
                {unlinkLoading ? "解除中..." : "解除する"}
              </button>
            ) : (
              <button
                onClick={handleLinkLine}
                disabled={linkLoading}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: "none", background: "#00C300",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", opacity: linkLoading ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {linkLoading ? "連携中..." : "LINEと連携する"}
              </button>
            )}
          </div>

          {!user.hasPassword && lineLinked && (
            <div style={{ marginTop: 12, background: "#FFF0F6", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #FF6B9D" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E" }}>
                パスワードが未設定のため LINE 連携は解除できません。
              </p>
            </div>
          )}
        </section>

        {/* ログイン方法 */}
        <section style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 2px 12px rgba(255,107,157,0.06)", border: "1.5px solid #FFF0F6" }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#8B7A8E", margin: "0 0 14px", letterSpacing: "0.05em" }}>ログイン方法</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F3EEF4" }}>
              <span style={{ fontSize: 18 }}>🔑</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E0A1E" }}>メール / パスワード</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: user.hasPassword ? "#6EE7B7" : "#F3EEF4",
                color: user.hasPassword ? "#1E0A1E" : "#8B7A8E",
              }}>
                {user.hasPassword ? "設定済み" : "未設定"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <span style={{ fontSize: 18, color: "#00C300" }}>◎</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E0A1E" }}>LINE</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: lineLinked ? "#6EE7B7" : "#F3EEF4",
                color: lineLinked ? "#1E0A1E" : "#8B7A8E",
              }}>
                {lineLinked ? "連携済み" : "未連携"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* トースト */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#1E0A1E" : "#ef4444",
          color: "#fff", borderRadius: 14, padding: "12px 20px",
          fontSize: 13, fontWeight: 700, zIndex: 999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}
    </div>
  );
}

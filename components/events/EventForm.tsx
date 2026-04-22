"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { EventFormData, EventStatus } from "@/types/event";

interface Props {
  eventId?: string;
  defaultValues?: Partial<EventFormData>;
  redirectTo?: string;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "PUBLISHED", label: "公開" },
  { value: "CANCELLED", label: "キャンセル" },
  { value: "COMPLETED", label: "終了" },
  { value: "SUSPENDED", label: "停止中" },
];

export default function EventForm({ eventId, defaultValues, redirectTo = "/admin/events" }: Props) {
  const router = useRouter();
  const isEdit = !!eventId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EventFormData>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    venue: defaultValues?.venue ?? "",
    address: defaultValues?.address ?? "",
    startAt: defaultValues?.startAt ? defaultValues.startAt.slice(0, 10) : "",
    status: defaultValues?.status ?? "DRAFT",
    imageUrl: defaultValues?.imageUrl ?? "",
    ticketCodes: defaultValues?.ticketCodes ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(defaultValues?.imageUrl ?? "");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileSelect(file: File) {
    setUploadError("");
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUploadError("JPG/PNG/WebP/GIF形式の画像のみアップロードできます");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("ファイルサイズは5MB以下にしてください");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let imageUrl = form.imageUrl ?? "";

    // 新しいファイルが選択されていたらアップロード
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error ?? "画像のアップロードに失敗しました");
        setLoading(false);
        return;
      }
      imageUrl = uploadData.url;
    }

    const url = isEdit ? `/api/events/${eventId}` : "/api/events";
    const method = isEdit ? "PUT" : "POST";

    // ticketCodes: newline-separated → JSON array
    const ticketCodesArr = (form.ticketCodes ?? "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        imageUrl: imageUrl || null,
        ticketCodes: ticketCodesArr.length ? JSON.stringify(ticketCodesArr) : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* フライヤー画像 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          フライヤー画像
          <span className="ml-2 text-xs text-gray-400 font-normal">JPG/PNG/WebP/GIF・5MBまで</span>
        </label>

        {imagePreview ? (
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000" }}>
            <div style={{ position: "relative", width: "100%", paddingBottom: "50%" }}>
              <Image
                src={imagePreview}
                alt="フライヤープレビュー"
                fill
                style={{ objectFit: "cover", opacity: 0.95 }}
                unoptimized
              />
              {/* オーバーレイ */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)",
              }} />
              {/* 変更・削除ボタン */}
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1E0A1E",
                    cursor: "pointer",
                  }}
                >
                  変更
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  削除
                </button>
              </div>
              {/* ラベル */}
              <div style={{ position: "absolute", bottom: 12, left: 16 }}>
                <span style={{ color: "#fff", fontSize: 11, opacity: 0.8 }}>フライヤー画像</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragging ? "#FF6B9D" : "#E5D0F0"}`,
              borderRadius: 16,
              padding: "40px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging
                ? "linear-gradient(135deg, #FFF0F6, #F3EAFF)"
                : "linear-gradient(135deg, #FFF8FC, #F8F3FF)",
              transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>🎫</div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#1E0A1E" }}>
              フライヤーをアップロード
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#8B7A8E" }}>
              クリックまたはドラッグ＆ドロップ
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {uploadError && (
          <p className="text-sm text-red-500 mt-2">{uploadError}</p>
        )}
      </div>

      {/* タイトル */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          value={form.title}
          onChange={handleChange}
          placeholder="例：〇〇 サイン会"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent"
        />
      </div>

      {/* 説明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="イベントの詳細情報..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent resize-none"
        />
      </div>

      {/* 会場・住所 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">会場名</label>
          <input
            name="venue"
            type="text"
            value={form.venue}
            onChange={handleChange}
            placeholder="例：〇〇ホール"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            placeholder="例：東京都渋谷区..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          開催日 <span className="text-red-500">*</span>
        </label>
        <input
          name="startAt"
          type="date"
          required
          value={form.startAt}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent"
        />
      </div>

      {/* ステータス */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-idol-400 focus:border-transparent bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-idol-500 hover:bg-idol-600 disabled:bg-idol-300 text-white font-medium rounded-lg text-sm transition"
        >
          {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-sm transition"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { importResource } from "@/actions/publisher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, Subject } from "@/types";

type FileStatus = "pending" | "uploading" | "done" | "error";

type FileEntry = {
  id: string;
  file: File;
  title: string;
  categoryId: string;
  subjectId: string;
  isFree: boolean;
  price: string;
  fileType: string;
  status: FileStatus;
  error?: string;
};

let idCounter = 0;
function uid() {
  return `f${Date.now()}-${++idCounter}`;
}

function entryFromFile(file: File): FileEntry {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
  const title = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: uid(),
    file,
    title,
    categoryId: "",
    subjectId: "",
    isFree: true,
    price: "0",
    fileType: ext,
    status: "pending",
  };
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }

  const { publicUrl } = await res.json();
  return publicUrl;
}

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
const selectClass =
  "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white";

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === "pending") return <span className="text-gray-400">○</span>;
  if (status === "uploading")
    return (
      <svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    );
  if (status === "done")
    return (
      <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  return (
    <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

interface ImportFormProps {
  categories: Category[];
  subjects: Subject[];
}

export function ImportForm({ categories, subjects }: ImportFormProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  function patch(id: string, updates: Partial<FileEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEntries((prev) => [...prev, ...Array.from(files).map(entryFromFile)]);
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  async function handleImport() {
    const toImport = entries.filter(
      (e) => e.status === "pending" && e.categoryId && e.title.trim()
    );
    if (toImport.length === 0) return;
    setIsImporting(true);

    for (const entry of toImport) {
      patch(entry.id, { status: "uploading", error: undefined });
      try {
        let fileUrl: string;
        try {
          fileUrl = await uploadFile(entry.file);
        } catch (uploadErr) {
          patch(entry.id, {
            status: "error",
            error: `Upload: ${uploadErr instanceof Error ? uploadErr.message : "failed"}`,
          });
          continue;
        }
        const result = await importResource({
          title: entry.title.trim(),
          description: entry.title.trim(),
          categoryId: entry.categoryId,
          subjectId: entry.subjectId || null,
          isFree: entry.isFree,
          price: entry.isFree ? 0 : parseFloat(entry.price) || 0,
          isPublished: publishImmediately,
          fileType: entry.fileType || null,
          pageCount: null,
          fileUrl,
          coverUrl: null,
        });
        if ("error" in result) {
          patch(entry.id, { status: "error", error: result.error });
        } else {
          patch(entry.id, { status: "done" });
        }
      } catch (err) {
        patch(entry.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setIsImporting(false);
  }

  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const readyCount = entries.filter(
    (e) => e.status === "pending" && e.categoryId && e.title.trim()
  ).length;
  const doneCount = entries.filter((e) => e.status === "done").length;
  const errorEntries = entries.filter((e) => e.status === "error");

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors select-none",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
        )}
      >
        <svg
          className="mb-3 h-10 w-10 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
        <p className="text-sm font-medium text-gray-700 pointer-events-none">
          {isDragging ? "Drop files here" : "Drag & drop files, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-400 pointer-events-none">
          PDF, DOCX, ZIP, and any other format
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* File table */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {entries.length} file{entries.length !== 1 ? "s" : ""}
              {doneCount > 0 && (
                <span className="text-green-600"> · {doneCount} imported</span>
              )}
              <span className="ml-2 text-gray-400 text-xs">
                Description defaults to title — edit after import if needed.
              </span>
            </p>
            <button
              onClick={() =>
                setEntries((prev) => prev.filter((e) => e.status !== "pending"))
              }
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Clear pending
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left">
                <tr>
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2 font-medium text-gray-600">File</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Title</th>
                  <th className="px-3 py-2 font-medium text-gray-600">
                    Category <span className="text-red-400">*</span>
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600">Subject</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Free</th>
                  <th className="px-3 py-2 font-medium text-gray-600">Price</th>
                  <th className="px-3 py-2 font-medium text-gray-600 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => {
                  const locked = entry.status !== "pending";
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "hover:bg-gray-50",
                        entry.status === "done" && "opacity-60"
                      )}
                    >
                      <td className="px-3 py-2">
                        <button
                          onClick={() => remove(entry.id)}
                          disabled={entry.status === "uploading"}
                          className="text-gray-300 hover:text-red-500 disabled:cursor-not-allowed"
                        >
                          ✕
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p
                          className="max-w-[140px] truncate font-mono text-xs text-gray-600"
                          title={entry.file.name}
                        >
                          {entry.file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(entry.file.size / 1024).toFixed(0)} KB
                        </p>
                      </td>
                      <td className="px-3 py-2 min-w-[180px]">
                        <input
                          value={entry.title}
                          onChange={(e) => patch(entry.id, { title: e.target.value })}
                          disabled={locked}
                          className={inputClass}
                          placeholder="Resource title"
                        />
                      </td>
                      <td className="px-3 py-2 min-w-[150px]">
                        <select
                          value={entry.categoryId}
                          onChange={(e) =>
                            patch(entry.id, { categoryId: e.target.value })
                          }
                          disabled={locked}
                          className={selectClass}
                        >
                          <option value="">Select…</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 min-w-[140px]">
                        <select
                          value={entry.subjectId}
                          onChange={(e) =>
                            patch(entry.id, { subjectId: e.target.value })
                          }
                          disabled={locked}
                          className={selectClass}
                        >
                          <option value="">None</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          value={entry.fileType}
                          onChange={(e) =>
                            patch(entry.id, { fileType: e.target.value })
                          }
                          disabled={locked}
                          className={inputClass}
                          placeholder="PDF"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={entry.isFree}
                          onChange={(e) =>
                            patch(entry.id, {
                              isFree: e.target.checked,
                              price: "0",
                            })
                          }
                          disabled={locked}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 w-24">
                        {!entry.isFree ? (
                          <input
                            type="number"
                            value={entry.price}
                            onChange={(e) =>
                              patch(entry.id, { price: e.target.value })
                            }
                            disabled={locked}
                            min="0.01"
                            step="0.01"
                            placeholder="9.99"
                            className={inputClass}
                          />
                        ) : (
                          <span className="text-xs text-green-600">Free</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center">
                          <StatusIcon status={entry.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Success banner */}
          {doneCount > 0 && !isImporting && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-green-700">
                {doneCount} resource{doneCount !== 1 ? "s" : ""} imported successfully.
              </p>
              <Link href="/dashboard/resources" className="text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-900">
                View My Resources
              </Link>
            </div>
          )}

          {/* Error summary */}
          {errorEntries.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-red-700">
                {errorEntries.length} file{errorEntries.length !== 1 ? "s" : ""} failed:
              </p>
              {errorEntries.map((e) => (
                <p key={e.id} className="text-xs text-red-600">
                  <span className="font-mono">{e.file.name}</span> — {e.error}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs text-amber-600">
                {readyCount < pendingCount && pendingCount > 0
                  ? `${pendingCount - readyCount} file${
                      pendingCount - readyCount !== 1 ? "s" : ""
                    } missing a category.`
                  : ""}
              </p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-600">Publish immediately</span>
              </label>
            </div>
            <Button onClick={handleImport} disabled={isImporting || readyCount === 0}>
              {isImporting
                ? "Importing…"
                : `Import ${readyCount} file${readyCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

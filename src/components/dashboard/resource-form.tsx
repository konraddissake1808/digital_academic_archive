"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResource, updateResource, type ResourceFormData } from "@/actions/publisher";
import type { Category, Subject } from "@/types";

interface ResourceFormProps {
  categories: Category[];
  subjects: Subject[];
  initialData?: Partial<ResourceFormData> & { id?: string };
}

async function uploadFile(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { signedUrl, path } = await res.json();

  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!uploadRes.ok) throw new Error("Failed to upload file");

  const supabase = createClient();
  const { data: { publicUrl } } = supabase.storage.from("resources").getPublicUrl(path);
  return publicUrl;
}

const selectClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export function ResourceForm({ categories, subjects, initialData }: ResourceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [isFree, setIsFree] = useState(initialData?.isFree ?? true);
  const [price, setPrice] = useState(String(initialData?.price ?? "0"));
  const [fileType, setFileType] = useState(initialData?.fileType ?? "");
  const [pageCount, setPageCount] = useState(String(initialData?.pageCount ?? ""));
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const isEdit = !!initialData?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        let fileUrl = initialData?.fileUrl ?? null;
        let coverUrl = initialData?.coverUrl ?? null;
        if (resourceFile) fileUrl = await uploadFile(resourceFile);
        if (coverFile) coverUrl = await uploadFile(coverFile);

        const data: ResourceFormData = {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          subjectId: subjectId || null,
          isFree,
          price: isFree ? 0 : parseFloat(price) || 0,
          fileType: fileType.trim(),
          pageCount: pageCount ? parseInt(pageCount) : null,
          fileUrl,
          coverUrl,
        };

        if (isEdit) {
          await updateResource(initialData.id!, data);
        } else {
          await createResource(data);
        }

        router.push("/dashboard/resources");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Introduction to Machine Learning"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="A comprehensive overview of…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={selectClass}>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Type of document (e.g. Textbook, Research Paper)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={selectClass}>
            <option value="">Select a subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Academic discipline (e.g. Computer Science, Physics)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="File Type"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          placeholder="PDF, DOCX, ZIP…"
        />
        <Input
          label="Page Count"
          type="number"
          value={pageCount}
          onChange={(e) => setPageCount(e.target.value)}
          placeholder="120"
          min="1"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => { setIsFree(e.target.checked); if (e.target.checked) setPrice("0"); }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Free resource</span>
        </label>
        {!isFree && (
          <Input
            label="Price (USD)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="9.99"
            required
          />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resource File
            {initialData?.fileUrl && (
              <span className="ml-2 text-xs text-gray-400 font-normal">(current file kept if none selected)</span>
            )}
          </label>
          <input
            type="file"
            onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image
            {initialData?.coverUrl && (
              <span className="ml-2 text-xs text-gray-400 font-normal">(current cover kept if none selected)</span>
            )}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Resource"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/resources")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

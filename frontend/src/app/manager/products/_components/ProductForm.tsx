"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

interface ProductFormData {
  id: string;
  slug: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  image: string;
  description: string;
  concern: string;
  type: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFormProps {
  initial?: Partial<ProductFormData & { slug: string }>;
  categories: Category[];
  mode: "create" | "edit";
}

const EMPTY_FORM: ProductFormData = {
  id: "",
  slug: "",
  name: "",
  price: "",
  stock: "100",
  category: "",
  image: "",
  description: "",
  concern: "",
  type: "",
};

const CONCERNS = [
  "Acne", "Dry Skin", "Oily Skin", "Sensitive Skin",
  "Anti-Aging", "Brightening", "Hyperpigmentation", "Redness",
];

export function ProductForm({ initial, categories, mode }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [charCount, setCharCount] = useState(initial?.description?.length ?? 0);

  const [imageTab, setImageTab] = useState<"url" | "file">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: "File size must be under 5MB." }));
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((e) => ({ ...e, image: "Invalid format. Use JPG, PNG, or WEBP." }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, image: "" }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const update = (field: keyof ProductFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "description") setCharCount(value.length);
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Product name is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = "Price must be a positive number.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = "Stock must be 0 or greater.";
    if (!form.category) errs.category = "Category is required.";
    if (mode === "create" && !form.id.trim()) errs.id = "Product ID is required.";
    
    if (imageTab === "url" && !form.image.trim()) {
      errs.image = "Image URL is required.";
    } else if (imageTab === "file" && mode === "create" && !imageFile) {
      errs.image = "Please select an image file to upload.";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleAIGenerate = async () => {
    if (!form.name.trim()) {
      setAiError("Enter a product name before generating a description.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await apiFetch("/api/manager/products/generate-description/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          concern: form.concern,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      update("description", data.description);
    } catch (e: any) {
      setAiError(e.message || "AI generation failed. You can still write manually.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", parseFloat(form.price).toFixed(2));
      formData.append("stock", String(parseInt(form.stock)));
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("finish", form.type);
      formData.append("skin_concerns", JSON.stringify(form.concern ? [form.concern] : []));

      if (mode === "create") {
        formData.append("id", form.id || form.slug);
      }

      if (imageTab === "url") {
        formData.append("image", form.image);
      } else if (imageFile) {
        formData.append("image_file", imageFile);
      }

      const url =
        mode === "create"
          ? "/api/products/"
          : `/api/products/${initial?.slug}/`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await apiFetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object"
            ? Object.entries(data)
                .map(([k, v]) => `${k}: ${v}`)
                .join("; ")
            : "Failed to save product.";
        setApiError(msg);
        return;
      }

      toast.success(
        mode === "create"
          ? "Product created successfully!"
          : "Product updated successfully!"
      );
      router.push("/manager/products");
    } catch (e: any) {
      setApiError(e.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Identity */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === "create" && (
            <Field label="Product ID *" error={errors.id}>
              <input
                value={form.id}
                onChange={(e) => update("id", e.target.value)}
                placeholder="unique-product-id"
                className={inputCls(!!errors.id)}
              />
            </Field>
          )}
          <Field label="Product Name *" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Vitamin C Brightening Serum"
              className={inputCls(!!errors.name)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Price (USD) *" error={errors.price}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="29.99"
              className={inputCls(!!errors.price)}
            />
          </Field>
          <Field label="Stock *" error={errors.stock}>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              className={inputCls(!!errors.stock)}
            />
          </Field>
          <Field label="Category *" error={errors.category}>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={selectCls(!!errors.category)}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Image */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Image</h2>
          <div className="flex bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold text-zinc-400">
            <button
              type="button"
              onClick={() => setImageTab("url")}
              className={`px-3 py-1 rounded-md transition-all ${
                imageTab === "url" ? "bg-zinc-700 text-white" : "hover:text-zinc-200"
              }`}
            >
              Paste URL
            </button>
            <button
              type="button"
              onClick={() => setImageTab("file")}
              className={`px-3 py-1 rounded-md transition-all ${
                imageTab === "file" ? "bg-zinc-700 text-white" : "hover:text-zinc-200"
              }`}
            >
              Upload File
            </button>
          </div>
        </div>

        {imageTab === "url" ? (
          <Field label="Image URL" error={errors.image}>
            <input
              type="url"
              value={form.image}
              onChange={(e) => {
                update("image", e.target.value);
                setImagePreview(e.target.value);
              }}
              placeholder="https://example.com/product.jpg"
              className={inputCls(!!errors.image)}
            />
          </Field>
        ) : (
          <Field label="Upload Image File" error={errors.image}>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-rose-500 bg-rose-500/5"
                  : "border-zinc-700 bg-zinc-800/40 hover:border-zinc-500"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
              />
              <div className="space-y-2">
                <div className="text-zinc-400 text-sm">
                  {imageFile ? (
                    <span className="font-semibold text-rose-400">{imageFile.name}</span>
                  ) : (
                    <span>Drag and drop your image, or <span className="text-rose-500 font-semibold">browse</span></span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>
          </Field>
        )}

        {imagePreview && (
          <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-700">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            {imageTab === "file" && imageFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageFile(null);
                  setImagePreview(initial?.image || null);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-xs text-zinc-300 hover:text-white transition-colors"
              >
                &times;
              </button>
            )}
          </div>
        )}
      </section>

      {/* Description with AI */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Description</h2>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-900/30 hover:bg-violet-800/40 border border-violet-700/40 text-violet-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              <> ✨ Generate with AI </>
            )}
          </button>
        </div>

        {aiError && (
          <p className="text-amber-400 text-xs bg-amber-900/20 border border-amber-600/30 rounded-lg px-3 py-2">
            {aiError}
          </p>
        )}

        <div className="relative">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            maxLength={600}
            placeholder="Describe the product — or click ✨ to generate automatically"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
          />
          <span className="absolute bottom-3 right-3 text-xs text-zinc-500">
            {charCount}/600
          </span>
        </div>
      </section>

      {/* Skin Details */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Skin Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Type">
            <input
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              placeholder="Serum, Moisturizer, Cleanser…"
              className={inputCls(false)}
            />
          </Field>
          <Field label="Skin Concern">
            <select
              value={form.concern}
              onChange={(e) => update("concern", e.target.value)}
              className={selectCls(false)}
            >
              <option value="">Select concern…</option>
              {CONCERNS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Submit */}
      {apiError && (
        <p className="text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-sm">
          {apiError}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 min-w-[140px]"
        >
          {submitting
            ? "Saving…"
            : mode === "create"
            ? "Create Product"
            : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/manager/products")}
          className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full bg-zinc-800 border ${
    hasError ? "border-red-500" : "border-zinc-700"
  } rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40`;
}

function selectCls(hasError: boolean) {
  return `w-full bg-zinc-800 border ${
    hasError ? "border-red-500" : "border-zinc-700"
  } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40`;
}

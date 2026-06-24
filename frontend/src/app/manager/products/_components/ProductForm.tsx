"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

interface ProductFormData {
  slug: string;
  name: string;
  price: string;
  original_price: string;
  discount: string;
  stock: string;
  category: string;
  image: string;
  description: string;
  finish: string;
  skin_concerns: string[];
  key_ingredients: string[];
  shades: string[];
  application_steps: string[];
  featured: boolean;
  is_active: boolean;
  is_deal_of_the_day: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFormProps {
  initial?: Partial<ProductFormData>;
  categories: Category[];
  availableConcerns: string[];
  availableIngredients: string[];
  mode: "create" | "edit";
}

const EMPTY_FORM: ProductFormData = {
  slug: "",
  name: "",
  price: "",
  original_price: "",
  discount: "",
  stock: "100",
  category: "",
  image: "",
  description: "",
  finish: "",
  skin_concerns: [],
  key_ingredients: [],
  shades: [],
  application_steps: [],
  featured: false,
  is_active: true,
  is_deal_of_the_day: false,
};

export function ProductForm({
  initial,
  categories,
  availableConcerns,
  availableIngredients,
  mode,
}: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [charCount, setCharCount] = useState(initial?.description?.length ?? 0);

  // Dynamic metadata helpers
  const [concernsList, setConcernsList] = useState<string[]>(availableConcerns);
  const [ingredientsList, setIngredientsList] = useState<string[]>(availableIngredients);
  const [customConcern, setCustomConcern] = useState("");
  const [customIngredient, setCustomIngredient] = useState("");

  const [imageTab, setImageTab] = useState<"url" | "file">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConcernsList(availableConcerns);
  }, [availableConcerns]);

  useEffect(() => {
    setIngredientsList(availableIngredients);
  }, [availableIngredients]);

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

  const update = (field: keyof ProductFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "description") setCharCount(value.length);
  };

  // Add Dynamic Metadata Handlers
  const handleAddCustomConcern = () => {
    const trimmed = customConcern.trim();
    if (!trimmed) return;
    if (!concernsList.includes(trimmed)) {
      setConcernsList((prev) => [...prev, trimmed]);
    }
    if (!form.skin_concerns.includes(trimmed)) {
      setForm((f) => ({ ...f, skin_concerns: [...f.skin_concerns, trimmed] }));
    }
    setCustomConcern("");
  };

  const handleAddCustomIngredient = () => {
    const trimmed = customIngredient.trim();
    if (!trimmed) return;
    if (!ingredientsList.includes(trimmed)) {
      setIngredientsList((prev) => [...prev, trimmed]);
    }
    if (!form.key_ingredients.includes(trimmed)) {
      setForm((f) => ({ ...f, key_ingredients: [...f.key_ingredients, trimmed] }));
    }
    setCustomIngredient("");
  };

  // Dynamic Array Handlers for Shades
  const handleAddShade = () => {
    setForm((f) => ({ ...f, shades: [...f.shades, ""] }));
  };

  const handleRemoveShade = (index: number) => {
    setForm((f) => ({ ...f, shades: f.shades.filter((_, i) => i !== index) }));
  };

  const handleShadeChange = (index: number, value: string) => {
    const newShades = [...form.shades];
    newShades[index] = value;
    setForm((f) => ({ ...f, shades: newShades }));
  };

  // Dynamic Array Handlers for Steps
  const handleAddStep = () => {
    setForm((f) => ({ ...f, application_steps: [...f.application_steps, ""] }));
  };

  const handleRemoveStep = (index: number) => {
    setForm((f) => ({ ...f, application_steps: f.application_steps.filter((_, i) => i !== index) }));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...form.application_steps];
    newSteps[index] = value;
    setForm((f) => ({ ...f, application_steps: newSteps }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Product name is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = "Price must be a positive number.";
    if (form.original_price && (isNaN(Number(form.original_price)) || Number(form.original_price) <= 0))
      errs.original_price = "Original price must be a positive number.";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = "Stock must be 0 or greater.";
    if (!form.category) errs.category = "Category is required.";
    if (mode === "edit" && !form.slug.trim()) errs.slug = "Product slug is required.";

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
          type: form.finish || "product",
          concern: form.skin_concerns?.[0] || "",
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
      if (form.original_price) {
        formData.append("original_price", parseFloat(form.original_price).toFixed(2));
      } else {
        formData.append("original_price", "");
      }
      formData.append("discount", form.discount || "");
      formData.append("stock", String(parseInt(form.stock)));
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("finish", form.finish);
      formData.append("featured", String(form.featured));
      formData.append("is_active", String(form.is_active));
      formData.append("is_deal_of_the_day", String(form.is_deal_of_the_day));

      // Serialize arrays as JSON arrays
      formData.append("skin_concerns", JSON.stringify(form.skin_concerns));
      formData.append("key_ingredients", JSON.stringify(form.key_ingredients));
      formData.append("shades", JSON.stringify(form.shades.filter((s) => s.trim() !== "")));
      formData.append("application_steps", JSON.stringify(form.application_steps.filter((s) => s.trim() !== "")));

      if (mode === "edit") {
        formData.append("slug", form.slug);
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
      router.refresh();
    } catch (e: any) {
      setApiError(e.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      {/* Product Identity */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Name *" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Vitamin C Brightening Serum"
              className={inputCls(!!errors.name)}
            />
          </Field>
          {mode === "edit" ? (
            <Field label="Product Slug (URL identifier) *" error={errors.slug}>
              <input
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="vitamin-c-brightening-serum"
                className={inputCls(!!errors.slug)}
              />
            </Field>
          ) : (
            <div className="flex flex-col justify-center text-xs text-zinc-500 bg-zinc-950/20 border border-dashed border-zinc-800 p-4 rounded-xl">
              <span className="font-semibold text-zinc-400">URL Slug Generation</span>
              <span className="mt-1">Auto-generated from name on creation. (e.g. {form.name ? `"${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}"` : `"vitamin-c-brightening-serum"`})</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          <Field label="Original Price (USD)" error={errors.original_price}>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.original_price}
              onChange={(e) => update("original_price", e.target.value)}
              placeholder="39.99"
              className={inputCls(!!errors.original_price)}
            />
          </Field>
          <Field label="Discount Label" error={errors.discount}>
            <input
              value={form.discount}
              onChange={(e) => update("discount", e.target.value)}
              placeholder="25% OFF / Special Deal"
              className={inputCls(!!errors.discount)}
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <Field label="Finish / Type">
            <input
              value={form.finish}
              onChange={(e) => update("finish", e.target.value)}
              placeholder="Dewy finish, Matte, Gel, Cream…"
              className={inputCls(false)}
            />
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
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-955 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-violet-300 text-xs font-semibold transition-colors disabled:opacity-50"
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
            className="w-full bg-zinc-850 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
          />
          <span className="absolute bottom-3 right-3 text-xs text-zinc-500">
            {charCount}/600
          </span>
        </div>
      </section>

      {/* Skin Concerns Checklist */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Skin Concerns</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Select all skin concerns addressed by this product.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={customConcern}
              onChange={(e) => setCustomConcern(e.target.value)}
              placeholder="Add custom concern..."
              className="bg-zinc-850 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 flex-1 sm:w-48"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomConcern();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomConcern}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {concernsList.map((concern) => {
            const isChecked = form.skin_concerns.includes(concern);
            return (
              <label
                key={concern}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-xs font-medium ${
                  isChecked
                    ? "border-rose-500 bg-rose-500/10 text-rose-300"
                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      update("skin_concerns", [...form.skin_concerns, concern]);
                    } else {
                      update(
                        "skin_concerns",
                        form.skin_concerns.filter((c) => c !== concern)
                      );
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isChecked
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                {concern}
              </label>
            );
          })}
        </div>
      </section>

      {/* Key Ingredients Checklist */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Key Ingredients</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Select high-performance ingredients featured in this formula.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={customIngredient}
              onChange={(e) => setCustomIngredient(e.target.value)}
              placeholder="Add custom ingredient..."
              className="bg-zinc-850 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 flex-1 sm:w-48"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomIngredient();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomIngredient}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ingredientsList.map((ingredient) => {
            const isChecked = form.key_ingredients.includes(ingredient);
            return (
              <label
                key={ingredient}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none text-xs font-medium ${
                  isChecked
                    ? "border-rose-500 bg-rose-500/10 text-rose-300"
                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      update("key_ingredients", [...form.key_ingredients, ingredient]);
                    } else {
                      update(
                        "key_ingredients",
                        form.key_ingredients.filter((i) => i !== ingredient)
                      );
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isChecked
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-zinc-700 bg-zinc-800"
                  }`}
                >
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                {ingredient}
              </label>
            );
          })}
        </div>
      </section>

      {/* Product Options (Shades & Application Steps) */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
        {/* Shades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Available Shades</h2>
              <p className="text-xs text-zinc-500">For makeup or tinted products. Leave empty if not applicable.</p>
            </div>
            <button
              type="button"
              onClick={handleAddShade}
              className="px-3 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
            >
              + Add Shade
            </button>
          </div>

          <div className="space-y-2">
            {form.shades.map((shade, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={shade}
                  onChange={(e) => handleShadeChange(index, e.target.value)}
                  placeholder={`Shade name or hex (e.g. "01 Light", "#F3E0C8")`}
                  className={inputCls(false)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveShade(index)}
                  className="p-2.5 bg-zinc-800 hover:bg-red-950/30 border border-zinc-700 hover:border-red-900/40 text-zinc-405 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
                >
                  &times;
                </button>
              </div>
            ))}
            {form.shades.length === 0 && (
              <p className="text-xs text-zinc-500 italic">No shades defined.</p>
            )}
          </div>
        </div>

        {/* Application Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">How to Use (Steps)</h2>
              <p className="text-xs text-zinc-500">Add instructional steps on how to apply the product.</p>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="px-3 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors"
            >
              + Add Step
            </button>
          </div>

          <div className="space-y-2">
            {form.application_steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 w-6">#{index + 1}</span>
                <input
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`e.g. "Apply 2-3 drops to clean dry skin before moisturizers."`}
                  className={inputCls(false)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="p-2.5 bg-zinc-800 hover:bg-red-950/30 border border-zinc-700 hover:border-red-900/40 text-zinc-405 text-zinc-400 hover:text-red-400 rounded-xl transition-all"
                >
                  &times;
                </button>
              </div>
            ))}
            {form.application_steps.length === 0 && (
              <p className="text-xs text-zinc-500 italic">No instructions defined.</p>
            )}
          </div>
        </div>
      </section>

      {/* Visibility & Promotion */}
      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Visibility & Promotions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Toggle
            label="Active / Available"
            description="Control product visibility on storefront."
            checked={form.is_active}
            onChange={(val) => update("is_active", val)}
          />
          <Toggle
            label="Featured Item"
            description="Highlight this product on homepage slides."
            checked={form.featured}
            onChange={(val) => update("featured", val)}
          />
          <Toggle
            label="Deal of the Day"
            description="Flag this item with special discount badge."
            checked={form.is_deal_of_the_day}
            onChange={(val) => update("is_deal_of_the_day", val)}
          />
        </div>
      </section>

      {/* Submit / Error messages */}
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

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer select-none">
      <div className="space-y-0.5 pr-2">
        <span className="text-xs font-semibold text-zinc-200">{label}</span>
        {description && <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{description}</p>}
      </div>
      <div className="relative inline-flex items-center flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
      </div>
    </label>
  );
}

function inputCls(hasError: boolean) {
  return `w-full bg-zinc-850 border ${
    hasError ? "border-red-500" : "border-zinc-700"
  } rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40`;
}

function selectCls(hasError: boolean) {
  return `w-full bg-zinc-850 border ${
    hasError ? "border-red-500" : "border-zinc-700"
  } rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40`;
}

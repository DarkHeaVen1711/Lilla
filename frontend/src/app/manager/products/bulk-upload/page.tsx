"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import Link from "next/link";

interface UploadError {
  row: number;
  reason: string;
}

interface UploadSuccess {
  row: number;
  status: string;
  product_id: string;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [imported, setImported] = useState<UploadSuccess[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = "name,price,description,type,concern,image_url,stock\n";
    const sampleRow = "Vitamin C Brightening Serum,29.99,A potent serum to brighten and even out skin tone.,Serum,Brightening,https://images.unsplash.com/photo-1620916566398-39f1143ab7be,150\n";
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lilla_product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setUploading(true);
    setSuccessMsg("");
    setErrors([]);
    setImported([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/api/manager/products/bulk-upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error("Bulk upload failed with validation errors.");
        } else {
          toast.error(data.error || "Failed to upload file.");
        }
        return;
      }

      setSuccessMsg(data.message);
      setImported(data.imported || []);
      toast.success("Products imported successfully!");
      setFile(null);
    } catch (e: any) {
      toast.error(e.message || "Network error occurred.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/manager/products"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Products
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Product Upload</h1>
            <p className="text-zinc-400 text-sm">Upload a CSV or Excel spreadsheet to add multiple products at once</p>
          </div>
          <div>
            <button
              onClick={downloadCSVTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-sm font-semibold transition-all border border-zinc-700"
            >
              <FileText className="w-4 h-4" /> Download Template
            </button>
          </div>
        </div>

        {/* Upload Container */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
              dragOver
                ? "border-rose-500 bg-rose-500/5"
                : "border-zinc-700 bg-zinc-800/40 hover:border-zinc-500"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-900/30 flex items-center justify-center text-rose-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <div className="text-zinc-300 font-medium">
                {file ? (
                  <span className="text-rose-400 font-semibold">{file.name}</span>
                ) : (
                  <span>Drag and drop your spreadsheet here, or <span className="text-rose-500">browse</span></span>
                )}
              </div>
              <p className="text-xs text-zinc-500">Supports CSV, XLSX (Max 500 rows / 5MB)</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {file && (
              <button
                onClick={() => setFile(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors"
                disabled={uploading}
              >
                Clear
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 min-w-[140px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Import Products"
              )}
            </button>
          </div>
        </div>

        {/* Results reports */}
        {(successMsg || errors.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2">Upload Results</h2>

            {/* Success Summary Banner */}
            {successMsg && (
              <div className="flex items-start gap-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{successMsg}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">All products listed in the file were successfully imported into the store catalog.</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errors.length > 0 && (
              <div className="flex items-start gap-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Bulk upload rejected due to validation errors ({errors.length})</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Because imports are atomic, no products were saved to the database. Fix the errors below and try again.</p>
                </div>
              </div>
            )}

            {/* Detailed Errors Table */}
            {errors.length > 0 && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Error Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {errors.map((err, i) => (
                        <tr key={i} className="hover:bg-zinc-800/20">
                          <td className="px-4 py-3 font-semibold text-zinc-400">Row {err.row}</td>
                          <td className="px-4 py-3 text-rose-400">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Success Table */}
            {imported.length > 0 && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Row</th>
                        <th className="px-4 py-3">Product ID</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {imported.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/20">
                          <td className="px-4 py-3 font-semibold text-zinc-400">Row {item.row}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.product_id}</td>
                          <td className="px-4 py-3 text-emerald-400">Created</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

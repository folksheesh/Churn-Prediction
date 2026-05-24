import React, { useState } from "react";
import axios from "axios";
import { Upload, XCircle, AlertCircle, CheckCircle2, FileText, Download, Sparkles } from "lucide-react";

const API_BASE = "http://localhost:8000/api/v1";

export default function BatchUpload() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string; errors: string[], data?: any[] } | null>(null);
  const [uploading, setUploading] = useState(false);

  const validateFileName = (file: File): string | null => {
    const name = file.name;
    const specialCharRegex = /[^a-zA-Z0-9._\-\s]/;
    if (specialCharRegex.test(name)) {
      return `Nama file mengandung karakter tidak valid: "${name}". Gunakan hanya huruf, angka, dan tanda (-_.) dalam nama file.`;
    }
    const doubleSpecialRegex = /[!@#$%^&*()+=\[\]{}|;:,<>?]{2,}/;
    if (doubleSpecialRegex.test(name)) {
      return 'Nama file mengandung karakter khusus berurutan. Harap ganti nama file sebelum upload.';
    }
    return null;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) { setUploadFile(null); return; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setUploadStatus({ success: false, message: 'Format file tidak sesuai. Hanya file .csv dan .xlsx yang diperbolehkan.', errors: [] });
      setUploadFile(null);
      return;
    }
    const nameError = validateFileName(file);
    if (nameError) {
      setUploadStatus({ success: false, message: nameError, errors: [] });
      setUploadFile(null);
      return;
    }
    setUploadStatus(null);
    setUploadFile(file);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await axios.post(`${API_BASE}/customers/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data.count) {
        setUploadStatus({
          success: true,
          message: `Berhasil mengimpor ${res.data.count} data pelanggan!`,
          errors: [],
          data: res.data.data
        });
        setUploadFile(null);
      } else {
        setUploadStatus({
          success: false,
          message: "Validasi gagal. Harap periksa error di bawah dan coba lagi.",
          errors: res.data.errors || []
        });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errMsg = "Koneksi ke server gagal. Pastikan backend sedang berjalan.";
      let errList: string[] = [];
      
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('column') || detail.toLowerCase().includes('missing')) {
          errMsg = 'Kolom wajib belum lengkap. Pastikan file sesuai format template yang tersedia.';
        } else if (detail.toLowerCase().includes('format') || detail.toLowerCase().includes('parse')) {
          errMsg = 'Format file tidak sesuai. Pastikan file adalah CSV atau XLSX yang valid.';
        } else {
          errMsg = 'Data gagal diproses. Silakan periksa file dan coba kembali.';
        }
      } else if (detail && typeof detail === 'object') {
        const errors = detail.errors || [];
        const missingCols = errors.filter((e: string) => e.toLowerCase().includes('column') || e.toLowerCase().includes('kolom'));
        errMsg = missingCols.length > 0
          ? `Kolom wajib belum lengkap: ${missingCols.join(', ')}.`
          : (detail.message || 'Data gagal diproses.');
        errList = errors.slice(0, 10);
      } else if (err.message?.toLowerCase().includes('network') || err.code === 'ERR_NETWORK') {
        errMsg = 'Koneksi ke server gagal. Pastikan backend sedang berjalan.';
      }

      setUploadStatus({
        success: false,
        message: errMsg,
        errors: errList
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Batch Customer Validation & Upload</h1>
      </header>

      <div className="p-8 max-w-[1280px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Left Column: Upload Dropzone & History (or Error State) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Conditional Upload or Error State */}
            {uploadStatus?.success === false ? (
              <div className="space-y-6 animate-fadeIn">
                {/* Error Alert Banner */}
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-4">
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600 mt-1">{uploadStatus.message}</p>
                    {uploadFile && (
                      <div className="mt-3 bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 w-fit">
                        <span className="text-slate-500">File:</span> {uploadFile.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Show missing columns UI ONLY if the error message is specifically about missing columns */}
                {uploadStatus.errors && uploadStatus.errors.length > 0 && uploadStatus.message.includes('Missing required columns') && (
                  <>
                    {/* Missing Required Columns Detail */}
                    <div className="glass-card rounded-2xl p-6 border border-zinc-200">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        <h4 className="text-sm font-bold text-slate-900">Missing Required Columns</h4>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">File kamu tidak memiliki kolom wajib berikut:</p>
                      
                      <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 mb-4">
                        <h5 className="text-xs font-bold text-rose-700 mb-3">Missing Columns ({uploadStatus.errors.length}):</h5>
                        <div className="grid grid-cols-2 gap-y-2">
                          {uploadStatus.errors.map((err, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                              <XCircle className="w-3.5 h-3.5" /> {err}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-emerald-700 mb-3">All Required Columns (27):</h5>
                        <p className="text-xs text-emerald-600 mb-2">Please ensure your file has all 27 columns defined in the template.</p>
                        <div className="grid grid-cols-2 gap-y-2">
                          {["age", "gender", "region_category", "logins_90d", "avg_transaction_value", "plan_tier"].map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {col}
                            </div>
                          ))}
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 italic">
                              + 21 more columns...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Correct File Format Example */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900">Correct Format Example</h4>
                      </div>
                      <pre className="bg-white border border-slate-200 rounded-xl p-4 text-[10px] sm:text-xs text-slate-600 overflow-x-auto font-mono leading-relaxed">
{`age,gender,security_no,region_category,...,plan_tier
35,Male,SEC123,North America,...,Premium
28,Female,SEC124,Europe,...,Basic
...`}
                      </pre>
                      <p className="text-xs text-slate-500 mt-4">Make sure your file has these exact column names in the first row. We recommend using our template.</p>
                    </div>
                  </>
                )}
                
                {/* Show Validation Errors if the error message is NOT about missing columns */}
                {uploadStatus.errors && uploadStatus.errors.length > 0 && !uploadStatus.message.includes('Missing required columns') && (
                  <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-rose-700 mb-3">Validation Errors:</h5>
                    <div className="space-y-2">
                      {uploadStatus.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-rose-600">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setUploadFile(null); setUploadStatus(null); }}
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Try Another File
                  </button>
                  <a href="/template_churn.xlsx" download className="flex-1 h-12 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Template
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFileUpload} className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-zinc-200 hover:border-indigo-400 transition-all cursor-pointer relative group animate-fadeIn shadow-sm">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">Drop file CSV atau XLSX di sini</h3>
                <p className="text-sm text-zinc-500 mb-2">atau klik untuk memilih file</p>
                <p className="text-xs text-zinc-400 mb-6">Format yang didukung: .csv dan .xlsx</p>
                
                {uploadFile ? (
                  <div className="text-center z-20 relative">
                    <p className="text-sm font-bold text-zinc-800">{uploadFile.name}</p>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="mt-4 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white font-bold rounded-xl transition-colors cursor-pointer z-30 relative"
                    >
                      {uploading ? "Analyzing..." : "Upload File"}
                    </button>
                  </div>
                ) : (
                  <div className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl relative z-20 pointer-events-none">
                    Select File
                  </div>
                )}

                {/* Success Alert overlay */}
                {uploadStatus?.success && (
                  <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center z-30 animate-fadeIn border border-emerald-200 p-8">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 shrink-0" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Upload Successful</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center">{uploadStatus.message}</p>
                    <button
                      type="button"
                      onClick={() => { setUploadFile(null); setUploadStatus(null); }}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Upload Another
                    </button>
                  </div>
                )}
              </form>
            )}
            
            {/* Data Table of Prediction Results */}
            {uploadStatus?.success && uploadStatus.data && (
              <div className="bg-white rounded-2xl p-6 mt-6 animate-fadeIn overflow-x-auto shadow-sm border border-zinc-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Prediction Results
                </h4>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                      <th className="pb-3 font-semibold">Customer ID</th>
                      <th className="pb-3 font-semibold">Tenure</th>
                      <th className="pb-3 font-semibold">Monthly Value</th>
                      <th className="pb-3 font-semibold">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadStatus.data.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-medium text-slate-800">{row.id || row.name || 'Unknown'}</td>
                        <td className="py-3 text-slate-500">{Math.round((row.days_since_joined || 0)/30)} mo</td>
                        <td className="py-3 font-bold text-slate-800">${Math.round(row.avg_transaction_value || 0)}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.churn_risk === "High" ? "bg-rose-50 text-rose-700 border-rose-100" :
                            row.churn_risk === "Medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}>
                            {row.churn_risk} ({Math.round((row.churn_probability || 0)*100)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadStatus.data.length > 10 && (
                  <div className="text-center mt-4 text-xs text-slate-500 italic">
                    Showing 10 of {uploadStatus.data.length} results. Go to Customers tab to view all.
                  </div>
                )}
              </div>
            )}

            {/* Upload History (Static) */}
            <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-zinc-200">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Upload History</h4>
              <div className="space-y-3">
                {[
                  { count: 1247, date: "May 8, 2026" },
                  { count: 892, date: "May 5, 2026" },
                  { count: 1563, date: "May 1, 2026" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 p-4 rounded-xl border border-zinc-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                      <div>
                        <p className="text-sm font-bold text-zinc-800">{item.count} customers</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-emerald-600">Completed</span>
                      <Download className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Guides */}
          <div className="space-y-6">
            
            {/* How to Use Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200">
              <h4 className="text-sm font-bold text-zinc-900 mb-6">Cara Menggunakan</h4>
              
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-zinc-100 z-0"></div>
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                    1
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-800">Siapkan file CSV atau XLSX</h5>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Download template dan isi data pelanggan sesuai format</p>
                  </div>
                </div>
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                    2
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-800">Upload file</h5>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Drag & drop atau klik untuk memilih file CSV atau XLSX</p>
                  </div>
                </div>
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border-2 border-white">
                    3
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-800">Get predictions</h5>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Download results with churn probabilities</p>
                  </div>
                </div>
              </div>

              <a href="/template_churn.xlsx" download className="block text-center w-full mt-8 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold rounded-xl border border-zinc-200 transition-colors text-xs">
                Download Template
              </a>
            </div>

            {/* CSV Column Guide Card */}
            <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-zinc-900 mb-4">Panduan Format CSV/XLSX</h4>
              <ul className="space-y-3 text-xs font-medium text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Customer Name</span>: the customer's name, e.g. <span className="bg-zinc-200 px-1 rounded">John Smith</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Region</span>: customer's geographic region, e.g. <span className="bg-zinc-200 px-1 rounded">North America</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Tenure</span>: subscription length in months, e.g. <span className="bg-zinc-200 px-1 rounded">18</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Monthly Value</span>: monthly subscription value, e.g. <span className="bg-zinc-200 px-1 rounded">149</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Login Frequency</span>: frequency of logins, e.g. <span className="bg-zinc-200 px-1 rounded">Daily</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Support Tickets</span>: support tickets count, e.g. <span className="bg-zinc-200 px-1 rounded">3</span></div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-0.5">•</span>
                  <div><span className="font-bold text-zinc-700">Last Activity</span>: last activity date, e.g. <span className="bg-zinc-200 px-1 rounded">2026-05-12</span></div>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Image as ImageIcon, Users, Eye, Sparkles, Loader2, Check, X, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '@/lib/api';
import { cn } from '@/lib/utils';



export default function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState({
    name: '',
    type: 'custom',
    description: '',
    subject: '',
    content: '',
    banner_image: '',
    status: 'active'
  });

  const [recipients, setRecipients] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<{subject: string, html: string} | null>(null);

  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'}>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success'|'error' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    if (!isNew) {
      fetchCampaign();
      fetchRecipients();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign({
        name: res.data.name,
        type: res.data.type,
        description: res.data.description || '',
        subject: res.data.subject,
        content: res.data.content,
        banner_image: res.data.banner_image || '',
        status: res.data.status
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to load campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await api.get(`/campaigns/${id}/recipients`);
      setRecipients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...campaign, status: 'active' };
      if (isNew) {
        await api.post('/campaigns', payload);
        navigate(`/admin/campaigns`);
      } else {
        await api.put(`/campaigns/${id}`, payload);
        showToast('Campaign saved successfully', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save campaign. (Is backend running/updated?)', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!id) return;
    if (recipients.length === 0) {
      showToast("Please add recipients first.", 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to send this campaign to ${recipients.length} recipients?`)) return;
    
    try {
      await api.post(`/campaigns/${id}/send`);
      showToast('Campaign sending started!', 'success');
      setTimeout(() => navigate('/admin/campaigns'), 1500);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to send campaign', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete this campaign?`)) return;
    try {
      await api.delete(`/campaigns/${id}`);
      showToast('Campaign deleted successfully', 'success');
      setTimeout(() => navigate('/admin/campaigns'), 1000);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete campaign', 'error');
    }
  };

  const handlePreview = async () => {
    try {
      const res = await api.post('/campaigns/preview', {
        subject: campaign.subject || "Preview Subject",
        content: campaign.content || "Preview Content",
        banner_image: campaign.banner_image,
        type: campaign.type
      });
      setPreviewHtml(res.data);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate preview', 'error');
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Max size is 2MB.", 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCampaign(prev => ({ ...prev, banner_image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const insertVariable = (variable: string) => {
    setCampaign(prev => ({ ...prev, content: prev.content + `{{${variable}}}` }));
  };

  const addRecipientsByRisk = async (risk: string) => {
    if (isNew) {
      showToast("Please save the campaign first before adding recipients.", 'error');
      return;
    }
    try {
      await api.post(`/campaigns/${id}/recipients`, { risk_levels: [risk] });
      fetchRecipients();
    } catch (err) {
      console.error(err);
      showToast('Failed to add recipients', 'error');
    }
  };

  const removeRecipient = async (customerId: string) => {
    try {
      await api.delete(`/campaigns/${id}/recipients/${customerId}`);
      fetchRecipients();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50 justify-center items-center">
      <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
      <p className="text-zinc-500 font-medium">Loading campaign details...</p>
    </div>
  );

  const isReadOnly = false;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50 overflow-y-auto">
      <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/campaigns')} className="p-2 -ml-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">{isNew ? 'Create Campaign' : campaign.name}</h1>
            <p className="text-xs text-zinc-500">{isNew ? 'Draft a new retention campaign' : 'Manage campaign details'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Eye size={16} /> Preview
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          {!isReadOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isNew ? 'Create Campaign' : 'Save Changes'}
              </button>
              {!isNew && recipients.length > 0 && (
                <button
                  onClick={handleSend}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Send size={16} /> Send Campaign
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Section 1: Info */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm flex items-center justify-center shadow-inner">1</span>
            Campaign Information
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase">Campaign Name</label>
              <input
                type="text"
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                disabled={isReadOnly}
                placeholder="e.g. Winter Winback 2026"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase">Description (Internal)</label>
              <textarea
                value={campaign.description}
                onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                disabled={isReadOnly}
                placeholder="Describe the goal of this campaign..."
                rows={2}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Banner */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-sm flex items-center justify-center shadow-inner">2</span>
            Banner Image
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-1/3 space-y-3">
              <p className="text-sm text-zinc-500">Upload a banner image to display at the top of the email.</p>
              {!isReadOnly && (
                <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-100 hover:border-zinc-400 transition-all text-sm font-semibold text-zinc-600">
                  <ImageIcon size={18} />
                  Choose Image
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleBannerUpload} />
                </label>
              )}
              {campaign.banner_image && !isReadOnly && (
                <button onClick={() => setCampaign({...campaign, banner_image: ''})} className="text-xs text-rose-500 font-semibold hover:text-rose-600">
                  Remove Image
                </button>
              )}
            </div>
            <div className="w-full sm:w-2/3">
              {campaign.banner_image ? (
                <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <img src={campaign.banner_image} alt="Banner Preview" className="w-full h-auto object-cover max-h-48" />
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 h-32 flex items-center justify-center text-zinc-400 text-sm">
                  No banner selected
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Editor */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm flex items-center justify-center shadow-inner">3</span>
            Email Content
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase">Email Subject</label>
              <input
                type="text"
                value={campaign.subject}
                onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                disabled={isReadOnly}
                placeholder="Special Offer for {{customer_name}}"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              />
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Sparkles size={16} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-900">Insert Variable:</span>
                <div className="flex gap-2">
                  {['customer_name', 'customer_email', 'risk_level', 'campaign_name'].map(v => (
                    <button key={v} onClick={() => insertVariable(v)} className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded text-[10px] font-bold hover:bg-indigo-100 transition-colors">
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-[300px] border border-zinc-200 rounded-xl overflow-hidden">
              <ReactQuill 
                theme="snow"
                value={campaign.content}
                onChange={(val) => setCampaign({ ...campaign, content: val })}
                readOnly={isReadOnly}
                className="h-[250px]"
              />
            </div>
          </div>
        </section>



      </div>

      {/* Preview Modal */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900">Email Preview</h3>
                <p className="text-xs text-zinc-500 mt-1">Subject: <span className="font-medium text-zinc-900">{previewHtml.subject}</span></p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 bg-zinc-50">
              <div 
                className="w-full bg-white shadow-sm mx-auto" 
                dangerouslySetInnerHTML={{ __html: previewHtml.html }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl shadow-black/5 border animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <p className="font-bold text-sm">{toast.message}</p>
          <button onClick={() => setToast(prev => ({...prev, show: false}))} className={`ml-3 p-1 rounded-md transition-colors ${toast.type === 'success' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-rose-600 hover:bg-rose-100'}`}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

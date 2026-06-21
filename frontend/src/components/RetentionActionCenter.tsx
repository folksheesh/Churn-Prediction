import { useState, useEffect } from 'react';
import { X, Tag, Headphones, Star, Package, Sparkles, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPE_MAPPING: Record<string, any> = {
  'discount_campaign': { icon: <Tag size={22} />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  'customer_support_followup': { icon: <Headphones size={22} />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'loyalty_program': { icon: <Star size={22} />, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  'product_recommendation': { icon: <Package size={22} />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' }
};

const DEFAULT_MAPPING = { icon: <Tag size={22} />, color: 'text-zinc-600', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200' };

interface RetentionActionCenterProps {
  customer: any;
  onClose: () => void;
  onSuccess: (campaign?: string) => void;
}

export default function RetentionActionCenter({ customer, onClose, onSuccess }: RetentionActionCenterProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [recommendedId, setRecommendedId] = useState<number | null>(null);
  const [recommendReason, setRecommendReason] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dynamic campaigns
        const campRes = await api.get('/campaigns');
        const activeCampaigns = campRes.data.filter((c: any) => c.status !== 'completed');
        setCampaigns(activeCampaigns);

        // Fetch AI recommendation
        try {
          const recRes = await api.get(`/mitigation/recommend/${customer.id}`);
          const recType = recRes.data.recommended_campaign;
          setRecommendReason(recRes.data.reason);

          // Find a dynamic campaign matching the recommended type
          const matched = activeCampaigns.find((c: any) => c.type === recType);
          if (matched) {
            setRecommendedId(matched.id);
            setSelectedId(matched.id);
          } else if (activeCampaigns.length > 0) {
            setSelectedId(activeCampaigns[0].id);
          }
        } catch (err) {
          console.error('Recommendation failed:', err);
          if (activeCampaigns.length > 0) setSelectedId(activeCampaigns[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [customer.id]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      // Use the new dynamic campaigns API to add recipient
      await api.post(`/campaigns/${selectedId}/recipients`, { 
        customer_ids: [customer.id]
      });
      
      const camp = campaigns.find(c => c.id === selectedId);
      
      // Update customer mitigation status manually in DB as fallback
      try {
         await api.post('/mitigation/execute', {
           customer_id: customer.id,
           campaign_name: camp?.type || 'discount_campaign',
           notes: `Assigned to dynamic campaign: ${camp?.name}`
         });
      } catch (e) {
         // Ignore old endpoint errors, new endpoint is the source of truth
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSuccess(camp?.name);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to assign campaign:', err);
      alert('Failed to assign customer to campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-success flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check size={14} className="text-white" />
          </div>
          <span>✅ Customer Assigned to Campaign!</span>
        </div>
      )}

      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
        <div 
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-zinc-200/60 animate-scale-in max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-7 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">Retention Action Center</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {customer.name} · <span className="font-mono">{customer.id}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-7 py-6 flex-1 overflow-y-auto">
            {/* Customer Context Bar */}
            <div className="flex items-center gap-4 mb-6 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <div className="w-10 h-10 rounded-lg bg-zinc-200/60 flex items-center justify-center text-zinc-700 font-bold text-sm border border-zinc-300/50">
                {customer.name?.substring(0, 2).toUpperCase() || 'NA'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{customer.name}</div>
                <div className="text-[11px] text-zinc-500">{customer.plan_tier} Plan · {customer.age} Yrs</div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-lg font-black",
                  customer.churn_risk === 'High' ? 'text-rose-600' : customer.churn_risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                )}>
                  {Math.round((customer.churn_probability || 0) * 100)}%
                </div>
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Churn Risk</div>
              </div>
            </div>

            {/* AI Recommendation Badge */}
            {!fetching && recommendedId && (
              <div className="mb-5 animate-fade-up">
                <div className="ai-badge mb-2">
                  <Sparkles size={13} />
                  AI Recommended Strategy
                </div>
                {recommendReason && (
                  <p className="text-[11px] text-zinc-500 ml-1">{recommendReason}</p>
                )}
              </div>
            )}

            {/* Campaign Cards */}
            {fetching ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm text-zinc-500 font-medium">Loading available campaigns...</span>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                 <p className="text-zinc-600 font-bold">No active campaigns found.</p>
                 <p className="text-xs text-zinc-500 mt-1">Please create a campaign first in the Campaigns tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campaigns.map((camp) => {
                  const isRecommended = camp.id === recommendedId;
                  const isSelected = camp.id === selectedId;
                  const map = TYPE_MAPPING[camp.type] || DEFAULT_MAPPING;
                  
                  return (
                    <div 
                      key={camp.id}
                      onClick={() => setSelectedId(camp.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 animate-fade-up",
                        isSelected ? `border-indigo-500 bg-indigo-50/30 shadow-md ring-4 ring-indigo-500/10` : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      )}
                    >
                      {/* Selection Indicator */}
                      <div className={cn(
                        "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected ? "border-indigo-500 bg-indigo-500" : "border-zinc-300"
                      )}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>

                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        map.bgColor, map.color
                      )}>
                        {map.icon}
                      </div>
                      
                      <h3 className={cn(
                        "text-sm font-bold mb-1 pr-6",
                        isSelected ? "text-indigo-950" : "text-zinc-800"
                      )}>
                        {camp.name}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed pr-2">
                        {camp.description || 'Custom retention campaign.'}
                      </p>

                      {isRecommended && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-bold uppercase tracking-wider rounded">
                          <Sparkles size={10} /> Recommended
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0 rounded-b-xl">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedId}
              className={cn(
                "px-6 py-2.5 text-sm font-bold text-white bg-zinc-900 rounded-xl shadow-md hover:bg-zinc-800 transition-all flex items-center gap-2",
                (loading || !selectedId) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Assign Customer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

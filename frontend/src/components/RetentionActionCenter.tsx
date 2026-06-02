import { useState, useEffect } from 'react';
import { X, Tag, Headphones, Star, Package, Sparkles, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Campaign {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    key: 'discount_campaign',
    label: 'Discount Campaign',
    description: 'Offer vouchers, discounts, or promotional incentives.',
    icon: <Tag size={22} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    key: 'customer_support_followup',
    label: 'Customer Support Follow-up',
    description: 'Flag customer for support outreach and issue resolution.',
    icon: <Headphones size={22} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    key: 'loyalty_program_enrollment',
    label: 'Loyalty Program Enrollment',
    description: 'Enroll customer into rewards and retention programs.',
    icon: <Star size={22} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    key: 'product_recommendation',
    label: 'Product Recommendation Campaign',
    description: 'Recommend relevant products based on customer behavior.',
    icon: <Package size={22} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
];

interface RetentionActionCenterProps {
  customer: any;
  onClose: () => void;
  onSuccess: (campaign?: string) => void;
}

export default function RetentionActionCenter({ customer, onClose, onSuccess }: RetentionActionCenterProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [recommendReason, setRecommendReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [assigned, setAssigned] = useState(false);

  // Fetch AI recommendation on mount
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await api.get(`/mitigation/recommend/${customer.id}`);
        setRecommended(res.data.recommended_campaign);
        setSelected(res.data.recommended_campaign); // Pre-select recommended
        setRecommendReason(res.data.reason);
      } catch (err) {
        console.error('Failed to fetch recommendation:', err);
        // Fallback: pre-select discount campaign
        setRecommended('discount_campaign');
        setSelected('discount_campaign');
      } finally {
        setRecommending(false);
      }
    };
    fetchRecommendation();
  }, [customer.id]);

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post('/mitigation/execute', {
        customer_id: customer.id,
        campaign_name: selected,
        notes: `Assigned via Retention Action Center`,
      });
      setAssigned(true);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        const label = CAMPAIGNS.find(c => c.key === selected)?.label || selected;
        onSuccess(label);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to assign campaign:', err);
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
          <span>✅ Campaign Assigned Successfully</span>
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
            {!recommending && recommended && (
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
            {recommending ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm text-zinc-500 font-medium">Analyzing customer profile...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAMPAIGNS.map((campaign, idx) => {
                  const isRecommended = campaign.key === recommended;
                  const isSelected = campaign.key === selected;

                  return (
                    <div
                      key={campaign.key}
                      className={cn(
                        'campaign-card',
                        isRecommended && 'recommended',
                        isSelected && 'selected',
                        assigned && 'pointer-events-none opacity-60'
                      )}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      onClick={() => !assigned && setSelected(campaign.key)}
                    >
                      {/* Recommended label */}
                      {isRecommended && (
                        <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                          Recommended
                        </div>
                      )}

                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isSelected ? 'bg-zinc-900 text-white' : `${campaign.bgColor} ${campaign.color}`
                        )}>
                          {campaign.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-bold text-zinc-900 leading-tight">{campaign.label}</h3>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{campaign.description}</p>
                        </div>
                        {/* Selection indicator */}
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900'
                            : 'border-zinc-300 bg-white'
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selected || loading || assigned}
              className={cn(
                "px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm",
                assigned
                  ? "bg-emerald-600 text-white"
                  : selected
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.97] hover:shadow-md"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Assigning...</>
              ) : assigned ? (
                <><Check size={14} /> Assigned</>
              ) : (
                'Assign Campaign'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

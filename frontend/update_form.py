import re

with open('src/pages/user/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace State
state_replacement = """  const [predData, setPredData] = useState<Record<string, any>>({
    age: '', gender: 'Male', region_category: 'City', joining_date: '', joined_through_referral: 'No',
    preferred_offer_types: 'Gift Vouchers/Coupons', medium_of_operation: 'Desktop', internet_option: 'Wi-Fi',
    days_since_last_login: '', avg_session_duration: '', avg_transaction_value: '',
    avg_frequency_login_days: '', points_in_wallet: '', used_special_discount: 'No',
    offer_application_preference: 'No', past_complaint: 'No', complaint_status: 'Not Applicable',
    feedback: 'No reason specified', plan_tier: 'Basic', logins_90d: '', active_days_90d: '',
    api_calls_90d: '', session_minutes_90d: '', days_since_active: ''
  });"""

content = re.sub(
    r'  // Single prediction state\n  const \[predName, setPredName.*?setPredInactive.*?\n',
    '  // Single prediction state\n' + state_replacement + '\n',
    content,
    flags=re.DOTALL
)

# Replace handlePredict
handle_predict_replacement = """  // Single Predict handler
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredictError(null);

    // Basic Validation
    if (!predData.age || !predData.joining_date) {
      return setPredictError("Please fill in required fields (Age, Joining Date).");
    }

    setPredicting(true);
    try {
      const payload = { ...predData };
      const res = await api.post('/predictions/single', payload);"""

content = re.sub(
    r'  // Single Predict handler\n  const handlePredict = async \(e: React\.FormEvent\) => \{.*?const res = await api\.post\(\'/predictions/single\', \{.*?\};\n',
    handle_predict_replacement + '\n',
    content,
    flags=re.DOTALL
)

# Replace the JSX form block
form_regex = r'<h3 className="text-lg font-extrabold text-slate-900 mb-6 font-outfit">Customer Information</h3>\s*<div className="space-y-5">.*?<button\s*type="submit"'

form_replacement = """<h3 className="text-lg font-extrabold text-slate-900 mb-6 font-outfit">Customer Information</h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries({
                    "age": { label: "Age", type: "number", placeholder: "e.g., 25" },
                    "gender": { label: "Gender", type: "select", options: ["Male", "Female"] },
                    "region_category": { label: "Region Category", type: "select", options: ["City", "Village", "Town"] },
                    "joining_date": { label: "Joining Date (dd-mm-yyyy)", type: "text", placeholder: "e.g., 15-01-2023" },
                    "joined_through_referral": { label: "Joined Through Referral", type: "select", options: ["Yes", "No", "?"] },
                    "preferred_offer_types": { label: "Preferred Offer Types", type: "select", options: ["Gift Vouchers/Coupons", "Credit/Debit Card Offers", "Without Offers"] },
                    "medium_of_operation": { label: "Medium of Operation", type: "select", options: ["Desktop", "Smartphone", "Both", "?"] },
                    "internet_option": { label: "Internet Option", type: "select", options: ["Wi-Fi", "Mobile_Data", "Fiber_Optic"] },
                    "days_since_last_login": { label: "Days Since Last Login", type: "number", placeholder: "e.g., 5" },
                    "avg_session_duration": { label: "Avg Session Duration", type: "number", placeholder: "e.g., 300.5" },
                    "avg_transaction_value": { label: "Avg Transaction Value", type: "number", placeholder: "e.g., 1500.75" },
                    "avg_frequency_login_days": { label: "Avg Login Frequency (Days)", type: "number", placeholder: "e.g., 12.5" },
                    "points_in_wallet": { label: "Points in Wallet", type: "number", placeholder: "e.g., 500" },
                    "used_special_discount": { label: "Used Special Discount", type: "select", options: ["Yes", "No"] },
                    "offer_application_preference": { label: "Offer Application Preference", type: "select", options: ["Yes", "No"] },
                    "past_complaint": { label: "Past Complaint", type: "select", options: ["Yes", "No"] },
                    "complaint_status": { label: "Complaint Status", type: "select", options: ["Not Applicable", "Unsolved", "Solved", "Solved in Follow-up", "No Information Available"] },
                    "feedback": { label: "Feedback", type: "select", options: ["Poor Product Quality", "Poor Website", "Poor Customer Service", "Too many ads", "No reason specified", "Reasonable Price", "User Friendly Website", "Products always in Stock", "Quality Customer Care"] },
                    "plan_tier": { label: "Plan Tier", type: "select", options: ["Basic", "Premium", "Platinum"] },
                    "logins_90d": { label: "Logins (last 90 days)", type: "number", placeholder: "e.g., 40" },
                    "active_days_90d": { label: "Active Days (last 90 days)", type: "number", placeholder: "e.g., 35" },
                    "api_calls_90d": { label: "API Calls (last 90 days)", type: "number", placeholder: "e.g., 5000" },
                    "session_minutes_90d": { label: "Session Minutes (last 90 days)", type: "number", placeholder: "e.g., 950.5" },
                    "days_since_active": { label: "Days Since Last Activity", type: "number", placeholder: "e.g., 2" },
                  }).map(([key, config]) => (
                    <div key={key}>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                        {config.label}
                      </label>
                      {config.type === "select" ? (
                        <div className="relative">
                          <select
                            value={predData[key] || ""}
                            onChange={(e) => setPredData({...predData, [key]: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                          >
                            <option value="" disabled>Select {config.label}...</option>
                            {config.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type={config.type}
                          step={config.type === 'number' ? 'any' : undefined}
                          placeholder={config.placeholder}
                          value={predData[key] === undefined ? "" : predData[key]}
                          onChange={(e) => setPredData({...predData, [key]: config.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  <button type="submit" """

content = re.sub(form_regex, form_replacement, content, flags=re.DOTALL)

with open('src/pages/user/Dashboard.tsx', 'w') as f:
    f.write(content)

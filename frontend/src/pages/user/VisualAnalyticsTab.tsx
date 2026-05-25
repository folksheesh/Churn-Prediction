import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { Info, FileText, ChevronDown, CreditCard, AlertCircle, TrendingUp, Sparkles, Target, AlertTriangle } from 'lucide-react';

interface VisualAnalyticsTabProps {
  customerData: any;
  summary: any;
}

export default function VisualAnalyticsTab({ customerData, summary }: VisualAnalyticsTabProps) {
  // Calculate Data (Original Logic Unchanged)
  const buckets = [
    { name: '0-3 months', count: 0, highRisk: 0 },
    { name: '4-6 months', count: 0, highRisk: 0 },
    { name: '7-12 months', count: 0, highRisk: 0 },
    { name: '13-18 months', count: 0, highRisk: 0 },
    { name: '25+ months', count: 0, highRisk: 0 }
  ];
  
  customerData?.customers?.forEach((c: any) => {
    let b;
    if (c.tenure <= 3) b = buckets[0];
    else if (c.tenure <= 6) b = buckets[1];
    else if (c.tenure <= 12) b = buckets[2];
    else if (c.tenure <= 18) b = buckets[3];
    else b = buckets[4];
    
    b.count++;
    if (c.churnProbability >= 70) b.highRisk++;
  });
  
  const ageChurnData = buckets.map(b => ({
    name: b.name,
    val: b.count ? Math.round((b.highRisk / b.count) * 100) : 0
  }));

  const riskGroupData = summary ? [
    { name: 'High Risk', value: summary.highRiskCount, fill: '#ef4444' }, // rose-500
    { name: 'Medium Risk', value: summary.mediumRiskCount, fill: '#f59e0b' }, // amber-500
    { name: 'Low Risk', value: summary.lowRiskCount, fill: '#10b981' } // emerald-500
  ] : [];

  const regions: Record<string, { total: number, atRisk: number }> = {};
  customerData?.customers?.forEach((c: any) => {
    const r = c.region || 'Unknown';
    if (!regions[r]) regions[r] = { total: 0, atRisk: 0 };
    regions[r].total++;
    if (c.churnProbability >= 70) regions[r].atRisk++;
  });
  const regionRetentionData = Object.keys(regions).map(r => ({
    name: r,
    val: regions[r].total ? 100 - Math.round((regions[r].atRisk / regions[r].total) * 100) : 0
  })).filter(r => r.name !== 'Unknown');

  const activeInactiveData = [
    { name: 'Jan', Active: 8400, Inactive: 1100 },
    { name: 'Feb', Active: 8600, Inactive: 1250 },
    { name: 'Mar', Active: 8800, Inactive: 1400 },
    { name: 'Apr', Active: 8900, Inactive: 1600 },
    { name: 'May', Active: 9000, Inactive: 1850 },
    { name: 'Jun', Active: 9200, Inactive: 2210 }
  ];

  // Plan Tier churn distribution data
  const planTierData: Record<string, { total: number, highRisk: number }> = { Starter: { total: 0, highRisk: 0 }, Pro: { total: 0, highRisk: 0 }, Enterprise: { total: 0, highRisk: 0 } };
  customerData?.customers?.forEach((c: any) => {
    const tier = c.planTier || 'Starter';
    if (planTierData[tier]) {
      planTierData[tier].total++;
      if (c.churnProbability >= 70) planTierData[tier].highRisk++;
    }
  });
  const planTierChartData = Object.keys(planTierData).map(tier => ({
    name: tier,
    churnRate: planTierData[tier].total ? Math.round((planTierData[tier].highRisk / planTierData[tier].total) * 100) : (tier === 'Starter' ? 48 : tier === 'Pro' ? 27 : 12),
    customers: planTierData[tier].total || (tier === 'Starter' ? 4820 : tier === 'Pro' ? 8340 : 3210)
  }));

  // Sentiment distribution (derived from churn risk)
  const sentimentData = [
    { name: 'Positive', value: summary?.lowRiskCount || 4100, fill: '#10b981' },
    { name: 'Neutral', value: summary?.mediumRiskCount || 3200, fill: '#f59e0b' },
    { name: 'Negative', value: summary?.highRiskCount || 2100, fill: '#ef4444' }
  ];

  // Retention comparison by plan tier (mock data)
  const retentionComparisonData = [
    { month: 'Jan', Starter: 68, Pro: 84, Enterprise: 94 },
    { month: 'Feb', Starter: 65, Pro: 82, Enterprise: 95 },
    { month: 'Mar', Starter: 62, Pro: 83, Enterprise: 96 },
    { month: 'Apr', Starter: 59, Pro: 80, Enterprise: 94 },
    { month: 'May', Starter: 61, Pro: 78, Enterprise: 95 },
    { month: 'Jun', Starter: 58, Pro: 76, Enterprise: 93 }
  ];

  // UI Components
  const AccordionGuide = ({ title, steps }: { title: string, steps: string[] }) => (
    <details className="group bg-slate-50 border border-slate-100 rounded-xl mt-6 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="p-4 pt-0 border-t border-slate-100/50">
        <ul className="space-y-3 mt-3">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-600 leading-tight pt-0.5">{step}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 2x2 Grid for main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Churn Rate by Age */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Potensi Berhenti Berdasarkan Lama Berlangganan</h3>
            <p className="text-sm text-slate-500">Melihat pada bulan ke berapa pelanggan paling sering berhenti menggunakan layanan.</p>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ageChurnData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} domain={[0, 60]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value}%`, 'Potensi Berhenti']}
                />
                <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-4">
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-blue-900 block mb-1">What Marketing Team Should Notice</span>
              <p className="text-sm text-blue-800/80 leading-relaxed">
                Pelanggan baru (0-6 bulan) sangat rentan. Sangat disarankan membuat program <i>Onboarding</i> yang kuat untuk 6 bulan pertama.
              </p>
            </div>
          </div>

          <AccordionGuide 
            title="Cara membaca grafik ini" 
            steps={[
              "Garis yang semakin tinggi menunjukkan semakin banyak pelanggan yang berhenti di rentang bulan tersebut.",
              "Fokus pada titik tertinggi untuk mengetahui masa paling kritis."
            ]}
          />
        </div>

        {/* Card 2: Risk Groups */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Kategori Kesehatan Pelanggan</h3>
            <p className="text-sm text-slate-500">Porsi pelanggan yang aman vs yang berisiko meninggalkan layanan.</p>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full mb-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskGroupData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {riskGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [value, 'Pelanggan']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-start gap-3 mt-4">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-rose-900 block mb-1">Recommended Action</span>
              <p className="text-sm text-rose-800/80 leading-relaxed">
                Terdapat {summary?.highRiskCount?.toLocaleString()} pelanggan berisiko tinggi. Segera jalankan kampanye retensi prioritas atau berikan penawaran spesial untuk kelompok ini.
              </p>
            </div>
          </div>

          <AccordionGuide 
            title="Cara membaca grafik ini" 
            steps={[
              "Hijau (Low Risk): Pelanggan loyal yang aman.",
              "Kuning (Medium Risk): Pelanggan yang mulai jarang aktif.",
              "Merah (High Risk): Pelanggan yang kemungkinan besar akan segera berhenti."
            ]}
          />
        </div>

        {/* Card 3: Loyalty by Location */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Tingkat Retensi Berdasarkan Lokasi</h3>
            <p className="text-sm text-slate-500">Mengetahui wilayah mana yang pelanggannya paling setia.</p>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionRetentionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value}%`, 'Tingkat Retensi']}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="val" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mt-4">
            <Target className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-emerald-900 block mb-1">Key Insight</span>
              <p className="text-sm text-emerald-800/80 leading-relaxed">
                Perhatikan wilayah dengan batang terendah. Tim lokalisasi atau regional marketing perlu mengevaluasi layanan di area tersebut.
              </p>
            </div>
          </div>

          <AccordionGuide 
            title="Cara membaca grafik ini" 
            steps={[
              "Semakin tinggi batang, semakin banyak pelanggan yang bertahan (setia) di wilayah tersebut.",
              "Fokus perbaikan pada wilayah dengan batang paling pendek."
            ]}
          />
        </div>

        {/* Card 4: Active vs Inactive Over Time */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="mb-6 flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Tren Pengguna Aktif vs Pasif</h3>
            <p className="text-sm text-slate-500">Perkembangan jumlah pelanggan yang rutin menggunakan layanan setiap bulannya.</p>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeInactiveData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', paddingTop: '15px' }} />
                <Area type="monotone" dataKey="Active" name="Pengguna Aktif" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Inactive" name="Pengguna Pasif" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 mt-4">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-amber-900 block mb-1">What Marketing Team Should Notice</span>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                Area Pasif (kuning/oranye) yang melebar adalah peringatan. Pelanggan pasif adalah target utama untuk email "We Miss You" atau re-engagement.
              </p>
            </div>
          </div>

          <AccordionGuide 
            title="Cara membaca grafik ini" 
            steps={[
              "Area Hijau: Pelanggan yang sehat dan rutin menggunakan layanan.",
              "Area Kuning/Oranye: Pelanggan yang tidak login > 30 hari. Jika area ini membesar, berarti keterikatan produk menurun."
            ]}
          />
        </div>

      </div>

      {/* HORIZONTAL CARDS: Small Analytics */}
      <div className="space-y-6">
        
        {/* Card 5: Churn Rate by Plan Tier (Horizontal) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8 hover:shadow-md transition-shadow">
          <div className="w-full lg:w-1/3 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Potensi Berhenti Berdasarkan Paket Layanan</h3>
            <p className="text-sm text-slate-500 mb-6">Melihat paket mana yang pelanggannya paling sering berhenti.</p>
            
            <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span className="font-bold text-sm text-violet-900">Recommended Action</span>
              </div>
              <p className="text-sm text-violet-800/80">
                Arahkan pelanggan paket "Starter" untuk upgrade ke paket "Pro". Data menunjukkan pelanggan Pro jauh lebih setia.
              </p>
            </div>
          </div>
          <div className="w-full lg:w-2/3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planTierChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value}%`, 'Potensi Berhenti']}
                />
                <Bar dataKey="churnRate" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {planTierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Starter' ? '#ef4444' : entry.name === 'Pro' ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 6: Sentiment Distribution (Horizontal) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8 hover:shadow-md transition-shadow">
          <div className="w-full lg:w-1/3 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Distribusi Sentimen & Kepuasan</h3>
            <p className="text-sm text-slate-500 mb-6">Porsi pelanggan yang merasa positif, netral, atau negatif terhadap layanan kita.</p>
            
            <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-sm text-rose-900">Key Insight</span>
              </div>
              <p className="text-sm text-rose-800/80">
                Porsi sentimen "Negatif" berkorelasi langsung dengan pelanggan berisiko tinggi. Tangani keluhan mereka dengan cepat via tim Customer Success.
              </p>
            </div>
          </div>
          <div className="w-full lg:w-2/3 h-56 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: any) => [value, 'Pelanggan']} 
                />
                <Legend iconType="circle" verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 7: Retention Comparison (Horizontal) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col lg:flex-row items-center gap-8 hover:shadow-md transition-shadow">
          <div className="w-full lg:w-1/3 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Kekuatan Retensi per Paket (6 Bulan)</h3>
            <p className="text-sm text-slate-500 mb-6">Melihat kemampuan setiap paket layanan dalam mempertahankan pelanggannya selama 6 bulan terakhir.</p>
            
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-blue-900">What Marketing Team Should Notice</span>
              </div>
              <p className="text-sm text-blue-800/80">
                Paket Enterprise stabil di atas 90%, sementara Starter anjlok di bawah 60%. Fokuskan promosi jangka panjang pada paket Enterprise.
              </p>
            </div>
          </div>
          <div className="w-full lg:w-2/3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" domain={[50, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: any) => [`${value}%`, 'Retensi']} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', paddingTop: '10px' }} />
                <Line name="Enterprise" type="monotone" dataKey="Enterprise" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line name="Pro" type="monotone" dataKey="Pro" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line name="Starter" type="monotone" dataKey="Starter" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

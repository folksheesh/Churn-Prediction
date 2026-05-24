import re

with open('src/pages/user/Dashboard.tsx', 'r') as f:
    content = f.read()

# Define the new charts container replacement
charts_replacement = """            {/* CHARTS CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Churn Forecast Line Chart */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 font-outfit">Customer Activity Trend</h4>
                    <p className="text-xs text-slate-400">Projected 7-day customer engagement trend.</p>
                  </div>
                </div>
                {summary && summary.churnForecast ? (
                  <div className="h-[280px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.churnForecast}>
                        <defs>
                          <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6d5dfc" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} unit="%" />
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="predictedChurn" stroke="#6d5dfc" strokeWidth={3} fillOpacity={1} fill="url(#colorChurn)" name="Churn Rate" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-400">Loading forecast chart...</div>
                )}
              </div>

              {/* Risk Breakdown Donut Chart */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Risk Breakdown</h4>
                  <p className="text-xs text-slate-400">Current customer health distribution.</p>
                </div>
                {summary ? (
                  <div className="h-[280px] w-full mt-auto flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Risk', value: summary.highRiskCount, color: '#f43f5e' },
                            { name: 'Medium Risk', value: summary.mediumRiskCount, color: '#f59e0b' },
                            { name: 'Low Risk', value: summary.lowRiskCount, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {
                            [
                              { name: 'High Risk', value: summary.highRiskCount, color: '#f43f5e' },
                              { name: 'Medium Risk', value: summary.mediumRiskCount, color: '#f59e0b' },
                              { name: 'Low Risk', value: summary.lowRiskCount, color: '#10b981' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full mt-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className="text-slate-600 font-medium">High</span></div>
                        <span className="font-bold text-slate-800">{summary.highRiskCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-slate-600 font-medium">Medium</span></div>
                        <span className="font-bold text-slate-800">{summary.mediumRiskCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-slate-600 font-medium">Low</span></div>
                        <span className="font-bold text-slate-800">{summary.lowRiskCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-400">Loading risk data...</div>
                )}
              </div>

            </div>"""

regex = r'\{\/\* CHARTS CONTAINER \*\/\}.*?<\/div>\s*<\/div>\s*\{\/\* BOTTOM SECTION GRID: REGION RETENTION & ACTIVITIES \*\/\}'
content = re.sub(regex, charts_replacement + '\n\n            {/* BOTTOM SECTION GRID: REGION RETENTION & ACTIVITIES */}', content, flags=re.DOTALL)

with open('src/pages/user/Dashboard.tsx', 'w') as f:
    f.write(content)

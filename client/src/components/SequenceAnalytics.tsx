"use client";

import { useEffect, useState } from "react";
import { getSequenceAnalytics } from "@/lib/apis";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, Mail, Reply, MousePointer2 } from "lucide-react";

interface SequenceAnalyticsProps {
  campaignId: string;
}

export default function SequenceAnalytics({ campaignId }: SequenceAnalyticsProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSequenceAnalytics(campaignId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [campaignId]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Total Sent</span>
          </div>
          <p className="text-2xl font-black text-blue-900">{data.reduce((sum, s) => sum + s.sent, 0)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            <span className="text-[10px] font-bold text-green-900 uppercase tracking-wider">Open Rate</span>
          </div>
          <p className="text-2xl font-black text-green-900">
            {Math.round((data.reduce((sum, s) => sum + s.opened, 0) / (data.reduce((sum, s) => sum + s.sent, 0) || 1)) * 100)}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Reply className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">Reply Rate</span>
          </div>
          <p className="text-2xl font-black text-orange-900">
            {Math.round((data.reduce((sum, s) => sum + s.replied, 0) / (data.reduce((sum, s) => sum + s.sent, 0) || 1)) * 100)}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer2 className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">Click Rate</span>
          </div>
          <p className="text-2xl font-black text-purple-900">
            {Math.round((data.reduce((sum, s) => sum + s.clicked, 0) / (data.reduce((sum, s) => sum + s.sent, 0) || 1)) * 100)}%
          </p>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="px-4">
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-6">Step-by-Step Conversion Funnel</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="stepNumber" 
                  tickFormatter={(val) => `Step ${val + 1}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="opened" name="Opened" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="replied" name="Replied" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* A/B Variant Analysis */}
      <div className="px-4 pb-8">
        <h3 className="text-sm font-bold text-gray-700 mb-4">A/B Testing Performance</h3>
        <div className="space-y-6">
          {data.filter(s => s.variants.length > 0).map((step, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step.stepNumber + 1}</span>
                <span className="text-xs font-medium text-gray-500">{step.subject}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.variants.map((v: any, vIdx: number) => (
                  <div key={vIdx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{v.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{v.sent} sent</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Open Rate</p>
                        <p className="text-lg font-black text-gray-700">{Math.round((v.opened / (v.sent || 1)) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Reply Rate</p>
                        <p className="text-lg font-black text-gray-700">{Math.round((v.replied / (v.sent || 1)) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {data.filter(s => s.variants.length > 0).length === 0 && (
            <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-sm text-gray-400">No A/B tests found in this sequence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

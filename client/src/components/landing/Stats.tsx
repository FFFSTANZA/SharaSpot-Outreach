"use client";

const stats = [
    { value: "41%", label: "Avg. Open Rate", detail: "Investor Pitching" },
    { value: "50k+", label: "Decisions/sec", detail: "Routing Engine" },
    { value: "96%", label: "Inbox Placement", detail: "Priority Protocol" },
    { value: "100%", label: "Data Isolation", detail: "Node Integrity" },
];

export default function Stats() {
    return (
        <section className="py-20 bg-[#0A0C0E] border-b border-white/5 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-[#0A0C0E] py-12 px-8 flex flex-col items-center text-center group">
                            <div className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tighter group-hover:text-brand transition-colors">
                                {stat.value}
                            </div>
                            <div className="text-brand text-[9px] font-bold uppercase tracking-[0.2em] mb-2">
                                {stat.label}
                            </div>
                            <div className="text-white/20 text-[10px] font-medium uppercase tracking-widest">
                                {stat.detail}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

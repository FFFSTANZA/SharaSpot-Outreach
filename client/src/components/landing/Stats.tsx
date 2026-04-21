"use client";

const stats = [
    { value: "41%", label: "Avg. Open Rate" },
    { value: "50k+", label: "Routing Decisions/sec" },
    { value: "96%", label: "Inbox Placement" },
    { value: "100%", label: "Data Isolation" },
];

export default function Stats() {
    return (
        <section className="py-20 bg-[#0A0C0E] border-y border-white/5">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center group">
                            <div className="text-3xl lg:text-5xl font-bold text-white mb-3 tracking-tighter group-hover:text-brand transition-colors duration-500">
                                {stat.value}
                            </div>
                            <div className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

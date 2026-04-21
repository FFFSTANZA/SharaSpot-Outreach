"use client";

const stats = [
    { value: "99.9%", label: "Delivery Rate" },
    { value: "50k+", label: "Emails Sent" },
    { value: "24/7", label: "Support" },
    { value: "95%", label: "Open Rate" },
];

export default function Stats() {
    return (
        <section className="py-16 bg-text-primary border-y border-border-light">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-white/60 text-sm">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
"use client";

import {
    Rocket, Briefcase, Megaphone, GraduationCap, Store, Building2
} from "lucide-react";

const useCases = [
    {
        id: "founders",
        icon: Rocket,
        title: "Founders & Startups",
        desc: "Pitch investors and initial partners with high-integrity outreach. No 'mass-mail' vibe.",
    },
    {
        id: "sales",
        icon: Megaphone,
        title: "High-Ticket Sales",
        desc: "Reach decision makers with personalized follow-ups that stop automatically when they reply.",
    },
    {
        id: "recruiting",
        icon: Building2,
        title: "Strategic Recruiting",
        desc: "Source talent at volume without hitting daily sender limits or landing in the promotions tab.",
    },
    {
        id: "agencies",
        icon: Store,
        title: "Agencies & Freelancers",
        desc: "Build your client pipeline while you sleep. Rotation protects your domains for the long haul.",
    },
];

export default function UseCases() {
    return (
        <section id="use-cases" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 animate-up">
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">Traffic Segments</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter leading-tight">
                        Built for those who can't <br />
                        <span className="text-brand">afford a "Spam" label.</span>
                    </h3>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {useCases.map((uc, i) => (
                        <div
                            key={uc.id}
                            className={`p-6 border border-border-light rounded-2xl hover:border-brand/30 transition-all animate-up animate-delay-${(i + 1) * 100}`}
                        >
                            <div className="mb-4 text-brand">
                                <uc.icon size={20} />
                            </div>
                            <h4 className="text-md font-black text-text-primary mb-3 uppercase tracking-tight">{uc.title}</h4>
                            <p className="text-[11px] text-text-secondary leading-[1.6] font-medium">
                                {uc.id === "founders" && "Don't burn your domain before you find PMF. Send high-signal emails that land in the primary inbox."}
                                {uc.id === "sales" && "Personalized follow-ups that stop the moment they reply, preventing that 'automated bot' smell."}
                                {uc.id === "recruiting" && "Reach top talent without triggering Gmail's daily bounce protections or getting flagged by filters."}
                                {uc.id === "agencies" && "Scale client outreach without burning through secondary domains every month. Built-in protection."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

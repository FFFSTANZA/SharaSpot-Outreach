"use client";

import { useRouter } from "next/navigation";

const personas = [
    {
        id: "founders",
        label: "Founders pitching investors",
        accent: "#1A56DB",
        body: "You drafted the right message. You found the right partner at the right fund. You hit send, and nothing comes back. Not even a bounce. Someone with half your traction books the meeting because their email landed where yours didn't. SharaSpot fixes the delivery problem so the pitch gets a fair shot.",
        detail: "Rotating sender accounts means your domain stays clean before you find product-market fit. Follow-ups stop the moment an investor replies, so you never double-email someone who already said yes.",
        cta: "Reach investors without burning your domain",
    },
    {
        id: "sales",
        label: "Sales teams chasing decisions",
        accent: "#B45309",
        body: "The VP of Ops whose budget you need gets 80 cold emails a day. Generic sequences get axed before the subject line is read. Your SDRs are sending 200 emails a week and booking one call. The problem isn't the offer. It's where the email lands and how it reads when it gets there.",
        detail: "SharaSpot sends through warmed-up accounts with human-like timing, so each email reads like it came from a colleague, not a tool. Sequences stop automatically when someone responds so there are no awkward follow-ups after a yes.",
        cta: "Get more calls from the same outreach",
    },
    {
        id: "hr",
        label: "HR teams sourcing candidates",
        accent: "#047857",
        body: "You're reaching out to a senior engineer at a competitor. Or a designer not actively looking. One wrong outreach tool gets your domain flagged and now even your job offers land in spam. The talent market is competitive enough without your emails working against you.",
        detail: "SharaSpot distributes sourcing volume across multiple accounts so no single sender ever trips rate limits. Candidate replies are detected immediately and sequences stop, protecting your team's reputation with every person in the pipeline.",
        cta: "Source talent at volume without burning your domain",
    },
    {
        id: "prm",
        label: "Teams managing partner relationships",
        accent: "#7C3AED",
        body: "You're trying to build a channel partner network or manage relationships with existing resellers. Your outreach lives in spreadsheets, your follow-ups are manual, and you have no idea who actually opened your last proposal. The relationship is only as good as your memory.",
        detail: "SharaSpot gives you a dedicated CRM for partner relationships—track stages, segment by region or tier, and keep every touchpoint in one place. Automated follow-ups remind you when it's time to reconnect, so no partnership slips through the cracks.",
        cta: "Manage partnerships without the spreadsheet chaos",
    },
];

export default function UseCases() {
    const router = useRouter();

    return (
        <section className="py-20 lg:py-28 bg-text-primary relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-40 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#1A56DB]/10 to-transparent blur-3xl" />
                <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-[#B45309]/8 to-transparent blur-3xl" />
                <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-[#047857]/6 to-transparent blur-3xl" />
                <div className="absolute bottom-40 right-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-[#7C3AED]/8 to-transparent blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="max-w-2xl mb-20">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-5">
                        Four outreach problems. One fix.
                    </h2>
                    <p className="text-white/70 text-lg leading-relaxed">
                        SharaSpot is not a general-purpose email tool. It is built specifically around the four types of outreach where delivery actually changes outcomes.
                    </p>
                </div>

                <div className="space-y-20">
                    {personas.map((p, i) => (
                        <div key={p.id} id={p.id} className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start">

                            {/* Left label col */}
                            <div className="lg:pt-1">
                                <div
                                    className="w-8 h-[3px] mb-5 rounded-full"
                                    style={{ background: p.accent }}
                                />
                                <h3
                                    className="text-lg font-bold leading-snug"
                                    style={{ color: p.accent }}
                                >
                                    {p.label}
                                </h3>
                            </div>

                            {/* Right body col */}
                            <div>
                                <p className="text-base text-white leading-[1.75] mb-6 font-medium">
                                    {p.body}
                                </p>
                                <p className="text-sm text-white/60 leading-[1.8] mb-8">
                                    {p.detail}
                                </p>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="text-sm font-semibold text-white border-b border-white/60 pb-0.5 hover:opacity-60 transition-opacity"
                                >
                                    {p.cta}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

interface Metrics {
  users: {
    total: number;
    premium: number;
    free: number;
    trial: number;
  };
  senders: {
    total: number;
    verified: number;
    unverified: number;
  };
  campaigns: {
    total: number;
    scheduled: number;
    sending: number;
    paused: number;
    cancelled: number;
    completed: number;
  };
  emails: {
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
  tracking: {
    opens: number;
    clicks: number;
    replies: number;
    bounces: number;
  };
  contacts: {
    total: number;
  };
  sequences: {
    total: number;
  };
  recentActivity: {
    usersCreated: number;
    campaignsCreated: number;
    emailsSent: number;
  };
  calculated: {
    openRate: string;
  };
  system: {
    redis: "up" | "down";
    worker: "up" | "down" | "stale";
  };
}

async function getMetrics(): Promise<Metrics | null> {
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  if (!adminSecret) {
    console.error("Admin secret not configured");
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        "x-admin-secret": adminSecret,
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.error("Failed to fetch metrics:", res.status);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default async function AdminDashboard() {
  const metrics = await getMetrics();

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Configuration Error</h2>
            <p className="text-red-600">
              Admin secret not configured. Please set NEXT_PUBLIC_ADMIN_SECRET in your .env file.
            </p>
            <p className="text-red-500 text-sm mt-2">
              Should match ADMIN_SECRET_KEY in your server .env
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SharaSpot Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Platform metrics and performance overview</p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${metrics.system.redis === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">Redis: {metrics.system.redis.toUpperCase()}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${metrics.system.worker === 'up' ? 'bg-green-500' : metrics.system.worker === 'stale' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">Worker: {metrics.system.worker.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={formatNumber(metrics.users.total)}
            subtitle="All registered users"
            color="blue"
          />
          <MetricCard
            title="Premium Users"
            value={formatNumber(metrics.users.premium)}
            subtitle={`${((metrics.users.premium / metrics.users.total) * 100 || 0).toFixed(1)}% of total`}
            color="emerald"
          />
          <MetricCard
            title="Free Users"
            value={formatNumber(metrics.users.free)}
            subtitle="Non-premium users"
            color="gray"
          />
          <MetricCard
            title="Trial Users"
            value={formatNumber(metrics.users.trial)}
            subtitle="On free trial"
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Senders"
            value={formatNumber(metrics.senders.total)}
            subtitle="Email senders configured"
            color="purple"
          />
          <MetricCard
            title="Verified Senders"
            value={formatNumber(metrics.senders.verified)}
            subtitle="Verified & ready to send"
            color="green"
          />
          <MetricCard
            title="Unverified Senders"
            value={formatNumber(metrics.senders.unverified)}
            subtitle="Pending verification"
            color="orange"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaigns</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CampaignStatusBadge status="Total" count={metrics.campaigns.total} color="blue" />
            <CampaignStatusBadge status="Scheduled" count={metrics.campaigns.scheduled} color="yellow" />
            <CampaignStatusBadge status="Sending" count={metrics.campaigns.sending} color="blue" />
            <CampaignStatusBadge status="Paused" count={metrics.campaigns.paused} color="orange" />
            <CampaignStatusBadge status="Completed" count={metrics.campaigns.completed} color="green" />
            <CampaignStatusBadge status="Cancelled" count={metrics.campaigns.cancelled} color="red" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emails</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <EmailStatusBadge status="Total" count={metrics.emails.total} color="gray" />
            <EmailStatusBadge status="Pending" count={metrics.emails.pending} color="yellow" />
            <EmailStatusBadge status="Sending" count={metrics.emails.sending} color="blue" />
            <EmailStatusBadge status="Sent" count={metrics.emails.sent} color="green" />
            <EmailStatusBadge status="Failed" count={metrics.emails.failed} color="red" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Opens"
            value={formatNumber(metrics.tracking.opens)}
            subtitle="Email opens tracked"
            color="cyan"
          />
          <MetricCard
            title="Total Clicks"
            value={formatNumber(metrics.tracking.clicks)}
            subtitle="Link clicks tracked"
            color="indigo"
          />
          <MetricCard
            title="Replies"
            value={formatNumber(metrics.tracking.replies)}
            subtitle="Replies detected"
            color="teal"
          />
          <MetricCard
            title="Bounces"
            value={formatNumber(metrics.tracking.bounces)}
            subtitle="Bounced emails"
            color="rose"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Contacts"
            value={formatNumber(metrics.contacts.total)}
            subtitle="All contacts in system"
            color="violet"
          />
          <MetricCard
            title="Sequence Steps"
            value={formatNumber(metrics.sequences.total)}
            subtitle="Follow-up steps configured"
            color="amber"
          />
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Open Rate</h3>
            <p className="text-4xl font-bold">{metrics.calculated?.openRate || "0.0"}%</p>
            <p className="text-blue-100 text-sm mt-1">Based on sent emails</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Last 7 Days Activity</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{metrics.recentActivity.usersCreated}</p>
              <p className="text-gray-500">New users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{metrics.recentActivity.campaignsCreated}</p>
              <p className="text-gray-500">Campaigns created</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{metrics.recentActivity.emailsSent}</p>
              <p className="text-gray-500">Emails sent</p>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Auto-refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    gray: "bg-gray-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    cyan: "bg-cyan-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4`}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function CampaignStatusBadge({ status, count, color }: { status: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    orange: "bg-orange-100 text-orange-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div className={`px-4 py-3 rounded-lg ${colorClasses[color]} text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm">{status}</p>
    </div>
  );
}

function EmailStatusBadge({ status, count, color }: { status: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div className={`px-4 py-3 rounded-lg ${colorClasses[color]} text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm">{status}</p>
    </div>
  );
}
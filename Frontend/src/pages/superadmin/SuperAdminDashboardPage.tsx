import { Link } from "react-router-dom";
import PlatformDashboard from "../../components/PlatformDashboard";
import Card from "../../components/ui/Card";
import { naira } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import { settingsApi } from "../../services/settings";
import { staffApi } from "../../services/staff";

export default function SuperAdminDashboardPage() {
  const settingsQ = useApi(settingsApi.get);
  const staffQ = useApi(staffApi.list);
  const s = settingsQ.data;
  const admins = staffQ.data?.filter((u) => u.role !== "ASSOCIATION_HEAD").length;
  return (
    <div className="space-y-6">
      <PlatformDashboard base="/super-admin" title="Platform Overview" subtitle="Full system oversight across all associations" />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-forest-800">
            {s ? (
              <>
                Fee <strong>{naira(s.fee)}</strong> · due day <strong>{s.dueDay}</strong> · grace <strong>{s.graceDays} days</strong> ·
                reminders <strong>{s.reminderDays}</strong> · {admins ?? "—"} administrators
              </>
            ) : (
              <span className="text-forest-700/60">{settingsQ.error || "Loading platform settings..."}</span>
            )}
          </p>
          <Link to="/super-admin/settings" className="font-medium text-forest-600 hover:underline">Change settings</Link>
        </div>
      </Card>
    </div>
  );
}
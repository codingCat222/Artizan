import { Link } from "react-router-dom";
import PlatformDashboard from "../../components/PlatformDashboard";
import Card from "../../components/ui/Card";
import { naira } from "../../lib/format";
import { useStore } from "../../store/AppStore";

export default function SuperAdminDashboardPage() {
  const { settings, staff } = useStore();
  return (
    <div className="space-y-6">
      <PlatformDashboard base="/super-admin" title="Platform Overview" subtitle="Full system oversight across all associations" />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-forest-800">
            Fee <strong>{naira(settings.fee)}</strong> · due day <strong>{settings.dueDay}</strong> · grace <strong>{settings.graceDays} days</strong> ·
            reminders <strong>{settings.reminderDays}</strong> · {staff.filter((u) => u.role !== "ASSOCIATION_HEAD").length} administrators
          </p>
          <Link to="/super-admin/settings" className="font-medium text-forest-600 hover:underline">Change settings</Link>
        </div>
      </Card>
    </div>
  );
}

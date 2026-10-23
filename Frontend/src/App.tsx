import { Navigate, Route, Routes } from "react-router-dom";
import PortalLayout from "./layouts/PortalLayout";
import PublicLayout from "./layouts/PublicLayout";
import AboutPage from "./pages/public/AboutPage";
import ActivatePage from "./pages/public/ActivatePage";
import ArtisanProfilePage from "./pages/public/ArtisanProfilePage";
import ChangePasswordPage from "./pages/public/ChangePasswordPage";
import ContactPage from "./pages/public/ContactPage";
import ForgotPasswordPage from "./pages/public/ForgotPasswordPage";
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/public/LoginPage";
import ResetPasswordPage from "./pages/public/ResetPasswordPage";
import SearchResultsPage from "./pages/public/SearchResultsPage";

import AccountSettingsPage from "./pages/artisan/AccountSettingsPage";
import ArtisanDashboardPage from "./pages/artisan/ArtisanDashboardPage";
import MockCheckoutPage from "./pages/artisan/MockCheckoutPage";
import MyDocumentsPage from "./pages/artisan/MyDocumentsPage";
import MyPaymentsPage from "./pages/artisan/MyPaymentsPage";
import MyProfilePage from "./pages/artisan/MyProfilePage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ArtisanDetailsPage from "./pages/admin/ArtisanDetailsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import ManageArtisansPage from "./pages/admin/ManageArtisansPage";
import ManageAssociationsPage from "./pages/admin/ManageAssociationsPage";
import ManageCategoriesPage from "./pages/admin/ManageCategoriesPage";
import ManagePaymentsPage from "./pages/admin/ManagePaymentsPage";
import ReportsPage from "./pages/admin/ReportsPage";

import AssociationDashboardPage from "./pages/association/AssociationDashboardPage";

import ManageStaffPage from "./pages/superadmin/ManageStaffPage";
import PlatformSettingsPage from "./pages/superadmin/PlatformSettingsPage";
import SuperAdminDashboardPage from "./pages/superadmin/SuperAdminDashboardPage";

import { adminNav, artisanNav, associationNav, superAdminNav } from "./router/navConfig";

/** Staff pages shared between admin and super admin, mounted under each base path. */
const staffRoutes = (base: string) => (
  <>
    <Route path={`${base}/artisans`} element={<ManageArtisansPage />} />
    <Route path={`${base}/artisans/:id`} element={<ArtisanDetailsPage />} />
    <Route path={`${base}/associations`} element={<ManageAssociationsPage />} />
    <Route path={`${base}/categories`} element={<ManageCategoriesPage />} />
    <Route path={`${base}/payments`} element={<ManagePaymentsPage />} />
    <Route path={`${base}/reports`} element={<ReportsPage />} />
    <Route path={`${base}/staff`} element={<ManageStaffPage />} />
    <Route path={`${base}/audit`} element={<AuditLogsPage />} />
  </>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route path="/search-results" element={<SearchResultsPage />} />
        <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<AboutPage />} />
        <Route path="/terms" element={<AboutPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/artisan-login" element={<Navigate to="/login" replace />} />
      <Route path="/staff-login" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      <Route element={<PortalLayout nav={artisanNav} allow={["ARTISAN"]} />}>
        <Route path="/artisan" element={<ArtisanDashboardPage />} />
        <Route path="/artisan/profile" element={<MyProfilePage />} />
        <Route path="/artisan/documents" element={<MyDocumentsPage />} />
        <Route path="/artisan/payments" element={<MyPaymentsPage />} />
        <Route path="/artisan/pay/mock" element={<MockCheckoutPage />} />
        <Route path="/artisan/settings" element={<AccountSettingsPage />} />
      </Route>

      <Route element={<PortalLayout nav={adminNav} allow={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        {staffRoutes("/admin")}
      </Route>

      <Route element={<PortalLayout nav={associationNav} allow={["ASSOCIATION_HEAD"]} />}>
        <Route path="/association" element={<AssociationDashboardPage />} />
        <Route path="/association/artisans" element={<ManageArtisansPage />} />
        <Route path="/association/artisans/:id" element={<ArtisanDetailsPage />} />
        <Route path="/association/payments" element={<ManagePaymentsPage />} />
        <Route path="/association/reports" element={<ReportsPage />} />
      </Route>

      <Route element={<PortalLayout nav={superAdminNav} allow={["SUPER_ADMIN"]} />}>
        <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
        <Route path="/super-admin/settings" element={<PlatformSettingsPage />} />
        {staffRoutes("/super-admin")}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
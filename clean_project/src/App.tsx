import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useLocalStorage';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SalesPage from './components/sales/SalesPage';
import ClientsPage from './components/clients/ClientsPage';
import ClientProfile from './components/clients/ClientProfile';
import DriversPage from './components/drivers/DriversPage';
import WarehousePage from './components/warehouse/WarehousePage';
import ExpensesPage from './components/expenses/ExpensesPage';
import WorkersPage from './components/workers/WorkersPage';
import ReportsPage from './components/reports/ReportsPage';
import SettingsPage from './components/settings/SettingsPage';
import UsersPage from './components/auth/UsersPage';

function AppContent() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sotuv" element={<SalesPage />} />
          <Route path="mijozlar" element={<ClientsPage />} />
          <Route path="mijozlar/:id" element={<ClientProfile />} />
          <Route path="haydovchilar" element={<DriversPage />} />
          <Route path="ombor" element={<WarehousePage />} />
          <Route path="xarajatlar" element={<ExpensesPage />} />
          <Route path="ishchilar" element={<WorkersPage />} />
          <Route path="foydalanuvchilar" element={<UsersPage />} />
          <Route path="hisobotlar" element={<ReportsPage />} />
          <Route path="sozlamalar" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppContent />;
}

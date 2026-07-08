import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/shared/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { SummaryPage } from "./pages/SummaryPage";
import { NotesPage } from "./pages/NotesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/alumnos" element={<StudentsPage />} />
        <Route path="/alumnos/:studentId" element={<StudentDetailPage />} />
        <Route path="/resumen" element={<SummaryPage />} />
        <Route path="/notas" element={<NotesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/usuarios" element={<AdminUsersPage />} />
      </Routes>
    </Layout>
  );
}

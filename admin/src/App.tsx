import "./App.css";
import { type ReactElement } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BlogManagementPage from "./pages/BlogManagementPage";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import ComparisionManagementPage from "./pages/Comparisions/ComparisionManagementPage";
import DealManagementPage from "./pages/Deal/DealsManagementPage";
import HomeManagementPage from "./pages/HomePageManagement";
import AddComparisionPage from "./pages/Comparisions/AddComparisionPage";
import UpdateComparisionPage from "./pages/Comparisions/UpdateComparisionPage";
import AddDealPage from "./pages/Deal/AddDealPage";
import AddReviewPage from "./pages/Reviews/AddReviewPage";
import EditReviewPage from "./pages/Reviews/EditReviewPage";
import ReviewPageManagementPage from "./pages/Reviews/ReviewPageManagementPage";
import DealsPage from "./pages/Deal/DealsPage";
import UpdateDealPage from "./pages/Deal/UpdateDealPage";
import ComparisionsPage from "./pages/Comparisions/ComparisionsPage";
import AddAuthor from "./pages/AddAuthor";
import ReviewsPage from "./pages/Reviews/ReviewsPage";
import BlogsPage from "./pages/Blogs/BlogsPage";
import AddBlogPage from "./pages/Blogs/AddBlogPage";
import LoginPage from "./pages/LoginPage";
import UserManagementPage from "./pages/UserManagementPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";

function AdminLayout({ children }: { children: ReactElement }): ReactElement {
  const navigate = useNavigate();
  const auth = useAuth();
  const logout: () => void = auth.logout;
  const user = auth.user;

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar on the left - fixed/sticky */}
      <Sidebar 
        onNavigate={(key) => { void navigate(`/${key}`); }} 
        onLogout={logout}
      />

      {/* Main content area - scrollable */}
      <div className="flex-1 flex flex-col ml-[276px] min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40">
          <Header 
            userName={user?.email || "Admin"} 
            onLogout={logout}
          />
        </div>
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="m-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent(): ReactElement{
  return (
    <Routes>
      {/* Login page - no layout */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* All other routes - protected with admin layout */}
      <Route path="/addauthor" element={
        <ProtectedRoute>
          <AdminLayout><AddAuthor /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/blogs" element={
        <ProtectedRoute>
          <AdminLayout><BlogsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/blogsmanagement" element={
        <ProtectedRoute>
          <AdminLayout><BlogManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/addblog" element={
        <ProtectedRoute>
          <AdminLayout><AddBlogPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/addblog/:id" element={
        <ProtectedRoute>
          <AdminLayout><AddBlogPage /></AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/deals" element={
        <ProtectedRoute>
          <AdminLayout><DealsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/dealsmanagement" element={
        <ProtectedRoute>
          <AdminLayout><DealManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/adddeal" element={
        <ProtectedRoute>
          <AdminLayout><AddDealPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/updatedeal/:id" element={
        <ProtectedRoute>
          <AdminLayout><UpdateDealPage /></AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/comparisons" element={
        <ProtectedRoute>
          <AdminLayout><ComparisionsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/Comparisionsmanagement" element={
        <ProtectedRoute>
          <AdminLayout><ComparisionManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/addcomparision" element={
        <ProtectedRoute>
          <AdminLayout><AddComparisionPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/updateComparision/:id" element={
        <ProtectedRoute>
          <AdminLayout><UpdateComparisionPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/home" element={
        <ProtectedRoute>
          <AdminLayout><HomeManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/addreview" element={
        <ProtectedRoute>
          <AdminLayout><AddReviewPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/updatereview/:id" element={
        <ProtectedRoute>
          <AdminLayout><EditReviewPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/reviewmanagement" element={
        <ProtectedRoute>
          <AdminLayout><ReviewPageManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/reviews" element={
        <ProtectedRoute>
          <AdminLayout><ReviewsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <AdminLayout><UserManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Redirect root to home */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout><HomeManagementPage /></AdminLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App(): ReactElement{
  return (
    <BrowserRouter>
      <AuthProvider>
      <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

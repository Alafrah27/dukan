import { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { useUser } from '@clerk/react';
import AdminPanelRoute from './pages/adminPanelRoute';
import Dashboard from './pages/dashboard/dashboard';
import Category from './pages/dashboard/category';
import Products from './pages/dashboard/products';
import Orders from './pages/dashboard/orders';
import Shipping from './pages/dashboard/shipping';
import Settings from './pages/dashboard/settings';
import Users from './pages/dashboard/users';
import LandingPage from './pages/landingpage/LandingPage';
import NotFound from './pages/notFound/NotFound';
import { useCreateUser } from './services/userQuery';
import Offers from './pages/dashboard/offers';
import Tailoring from './pages/dashboard/tailoring';

// Protected route component to protect dashboard access
function ProtectedAdminRoute({ isLoaded, isSignedIn, isAdmin, children }) {
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-textSecondary">جارٍ التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  // If not signed in or not an admin, protect dashboard by redirecting to landing page
  if (!isSignedIn || !isAdmin) {
    return <Navigate to="/landing" replace />;
  }

  return children;
}

function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { createUser } = useCreateUser();

 useEffect(() => {
        if (isLoaded && isSignedIn) {
            createUser()
                .then((data) => {
                    console.log("User successfully synced to database:", data);
                })
                .catch((err) => {
                    console.error("Failed to sync user to database:", err);
                });
        }
    }, [isLoaded, isSignedIn, createUser]);

  // Extract role from user.publicMetadata
  const role = user?.publicMetadata?.role;
  const isAdmin = Boolean(isSignedIn && (role === 'admin' || user?.publicMetadata?.isAdmin === true));

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-sm font-semibold text-textSecondary">جارٍ التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* If user & isAdmin & logged in -> dashboard; if user & isLoggedIn & !isAdmin -> landingpage */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAdmin ? "/admin/dashboard" : "/landing"}
              replace
            />
          }
        />

        {/* Landing Page: If is user & isAdmin & loggedIn, redirect to dashboard. Otherwise show LandingPage */}
        <Route
          path="/landing"
          element={
            isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <LandingPage />
            )
          }
        />
        <Route path="/landingpage" element={<Navigate to="/landing" replace />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute isLoaded={isLoaded} isSignedIn={isSignedIn} isAdmin={isAdmin}>
              <AdminPanelRoute />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<Category />} />
          <Route path="products" element={<Products />} />
          <Route path="tailoring" element={<Tailoring />} />
          <Route path="offers" element={<Offers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 Route for any unmatched URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Loader2} from 'lucide-react';
import App from './App.tsx';
import './index.css';
import {AuthProvider, useAuth} from './auth/AuthContext';
import {DataProvider} from './data/DataStore';
import LoginScreen from './components/LoginScreen';

function Root() {
  const {user, loading, logout} = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-slate-950 text-emerald-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  // Account exists but isn't linked to a shop yet (e.g. older account before shops).
  if (!user.shopId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F5F7FA] dark:bg-slate-950 text-center px-6">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-sm">
          Akun ini belum terhubung ke toko. Silakan daftar ulang sebagai Owner (membuat toko)
          atau sebagai Staff/Accountant dengan Kode Toko.
        </p>
        <button onClick={logout} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl">
          Keluar
        </button>
      </div>
    );
  }

  // shopId drives loading of the shop's shared data
  return (
    <DataProvider shopId={user.shopId}>
      <App />
    </DataProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);

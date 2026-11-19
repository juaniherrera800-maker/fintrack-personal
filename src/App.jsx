import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import { supabase } from "./lib/supabase";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setError(error.message);
      } else {
        setSession(data.session);
      }

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setError("");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm("¿Querés cerrar tu sesión de FinTrack?");

    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="auth-logo-icon">
            <Wallet size={25} />
          </div>
          <h2>FinTrack</h2>
          <p>Preparando tu espacio financiero...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <>
      <Dashboard
        userId={session.user.id}
        user={session.user}
        onLogout={handleLogout}
      />

      {error && <div className="fintrack-session-error">{error}</div>}
    </>
  );
}

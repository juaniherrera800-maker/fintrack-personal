import { useState } from "react";
import { supabase } from "./lib/supabase";
import { Wallet, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setMessageType("");

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage("¡Cuenta creada! Ingresando a FinTrack...");
          setMessageType("success");
        } else {
          setMessage(
            "La cuenta fue creada, pero todavía requiere confirmación. Revisá que Confirm email esté desactivado en Supabase.",
          );
          setMessageType("error");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      let friendlyMessage = error.message;

      if (error.message?.toLowerCase().includes("already registered")) {
        friendlyMessage =
          "Este correo ya tiene una cuenta. Probá iniciar sesión.";
      } else if (
        error.message?.toLowerCase().includes("invalid login credentials")
      ) {
        friendlyMessage = "Correo o contraseña incorrectos.";
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        friendlyMessage =
          "Tu correo todavía no está confirmado. Revisá la configuración de Supabase.";
      } else if (error.message?.toLowerCase().includes("password")) {
        friendlyMessage = "La contraseña debe tener al menos 6 caracteres.";
      }

      setMessage(friendlyMessage || "Ocurrió un error.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(newMode) {
    setMode(newMode);
    setMessage("");
    setMessageType("");
    setPassword("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Wallet size={25} />
          </div>
          <span>FinTrack</span>
        </div>

        <div className="auth-heading">
          <h1>{mode === "login" ? "Bienvenido de nuevo" : "Creá tu cuenta"}</h1>

          <p>
            {mode === "login"
              ? "Ingresá para administrar tus finanzas."
              : "Organizá tus gastos de forma simple."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label>Contraseña</label>

          <div className="auth-password">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Mostrar u ocultar contraseña"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {message && (
            <div className={`auth-message ${messageType}`} role="alert">
              {message}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              ¿Todavía no tenés cuenta?{" "}
              <button type="button" onClick={() => changeMode("register")}>
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button type="button" onClick={() => changeMode("login")}>
                Iniciá sesión
              </button>
            </>
          )}
        </div>

        <p className="auth-footer">
          Tus finanzas, organizadas en un solo lugar.
        </p>
      </section>
    </main>
  );
}

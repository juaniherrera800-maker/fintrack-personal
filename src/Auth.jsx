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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage("¡Cuenta creada correctamente!");
        } else {
          setMessage(
            "Cuenta creada. Revisá tu correo para confirmar el registro.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
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
              : "Empezá a organizar tu dinero de forma inteligente."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" disabled={loading}>
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
              <button
                onClick={() => {
                  setMode("register");
                  setMessage("");
                }}
              >
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
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

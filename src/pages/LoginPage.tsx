import {
  ArrowRight,
  Fingerprint,
  LockKey,
  ShieldCheck,
  SpinnerGap,
  TerminalWindow,
} from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  if (!loading && session && isAdmin) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await signIn(email.trim(), password);
      const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Falha no acesso.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="login-brand"><TerminalWindow size={30} weight="duotone" /> CENTRAL_DE_DADOS</div>
        <div>
          <span className="eyebrow">CANAL CRIPTOGRAFADO</span>
          <h1>Acesso restrito ao operador.</h1>
          <p>Consulte os dados enviados pelo seu formulario em uma area privada, protegida pelo Supabase Auth e por regras no banco.</p>
        </div>
        <ul>
          <li><ShieldCheck size={20} weight="fill" /> Row Level Security ativa</li>
          <li><Fingerprint size={20} /> Sessao autenticada</li>
          <li><LockKey size={20} /> Chaves privadas somente no servidor</li>
        </ul>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form-header">
            <span className="terminal-prompt mono">$ auth --admin</span>
            <h2>Identifique-se</h2>
            <p>Use o email e a senha criados no Supabase.</p>
          </div>

          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@seudominio.com"
              required
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha segura"
              minLength={8}
              required
            />
          </label>

          {error && <div className="alert error-alert">{error}</div>}

          <button className="button primary login-submit" disabled={loading}>
            {loading ? <SpinnerGap className="spin" size={20} /> : <LockKey size={20} />}
            {loading ? "Validando..." : "Acessar painel"}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>
      </section>
    </main>
  );
}

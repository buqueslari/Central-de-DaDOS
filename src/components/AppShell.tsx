import {
  Circle,
  FileText,
  GearSix,
  ShieldCheck,
  SignOut,
  SquaresFour,
  TerminalWindow,
} from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { previewMode } from "../lib/env";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Recebimentos", icon: FileText },
  { to: "/settings", label: "Configuracoes", icon: GearSix },
];

export function AppShell({ children }: AppShellProps) {
  const { email, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="brand-mark" aria-label="Central de dados">
          <SquaresFour size={24} weight="bold" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " is-active" : ""}`
                }
                title={item.label}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-link sidebar-button"
            type="button"
            onClick={() => void signOut()}
            title="Sair"
          >
            <SignOut size={23} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-title">
            <TerminalWindow size={28} weight="duotone" />
            <div>
              <h1>Central de dados</h1>
              <p>Monitoramento seguro de recebimentos</p>
            </div>
          </div>
          <div className="system-status" title={email}>
            <Circle className="status-dot" size={10} weight="fill" />
            <span>{previewMode ? "AMBIENTE DEMO" : "SISTEMA ONLINE"}</span>
            <ShieldCheck size={18} weight="fill" />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

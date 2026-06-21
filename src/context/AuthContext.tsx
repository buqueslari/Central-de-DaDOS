import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { previewMode } from "../lib/env";
import { getSupabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  email: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function verifyAdmin(userId: string) {
  const { data, error } = await getSupabase()
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(previewMode);
  const [loading, setLoading] = useState(!previewMode);

  useEffect(() => {
    if (previewMode) return;

    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        try {
          setIsAdmin(await verifyAdmin(data.session.user.id));
        } catch {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (!nextSession) {
          setIsAdmin(false);
          setLoading(false);
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (previewMode) return;
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setLoading(false);
      throw new Error("Email ou senha incorretos.");
    }

    const admin = await verifyAdmin(data.session.user.id);
    if (!admin) {
      await supabase.auth.signOut();
      setLoading(false);
      throw new Error("Este usuario nao possui acesso administrativo.");
    }

    setSession(data.session);
    setIsAdmin(true);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    if (!previewMode) await getSupabase().auth.signOut();
    setSession(null);
    setIsAdmin(previewMode);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAdmin,
      loading,
      email: previewMode ? "admin@preview.local" : session?.user.email ?? "",
      signIn,
      signOut,
    }),
    [session, isAdmin, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return context;
}

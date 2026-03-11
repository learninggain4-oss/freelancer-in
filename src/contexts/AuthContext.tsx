import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { loginOneSignal, logoutOneSignal, promptForPushPermission } from "@/lib/onesignal";

type Profile = Tables<"profiles">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; data: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasPromptedPushPermissionRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, user_type, full_name, user_code, email, gender, date_of_birth, marital_status, education_level, mobile_number, whatsapp_number, previous_job_details, work_experience, education_background, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, approval_status, approval_notes, approved_at, available_balance, hold_balance, is_disabled, disabled_reason, created_at, updated_at, edit_request_status, bank_holder_name, bank_name, bank_account_number, bank_ifsc_code, upi_id, wallet_number, profile_photo_path, wallet_active, coin_balance")
      .eq("user_id", userId)
      .maybeSingle();

    // If account is disabled, sign out immediately
    if (data && (data as any).is_disabled) {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      setUser(null);
      setLoading(false);
      // We'll show an alert via the login page
      throw new Error("ACCOUNT_DISABLED");
    }

    setProfile(data as unknown as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const requestPushPermissionOnce = () => {
    if (hasPromptedPushPermissionRef.current) return;
    hasPromptedPushPermissionRef.current = true;
    window.setTimeout(() => {
      promptForPushPermission();
    }, 500);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loginOneSignal(session.user.id);
          requestPushPermissionOnce();
          setTimeout(() => fetchProfile(session.user.id).catch(() => {}), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loginOneSignal(session.user.id);
        requestPushPermissionOnce();
        fetchProfile(session.user.id).catch(() => {});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh profile every 1 second across all pages
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchProfile(user.id).catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error | null };

    // Check if the account is disabled
    if (signInData.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_disabled, disabled_reason")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (prof && (prof as any).is_disabled) {
        await supabase.auth.signOut();
        const reason = (prof as any).disabled_reason || "Your account has been disabled by an administrator.";
        return { error: new Error(reason) };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    hasPromptedPushPermissionRef.current = false;
    logoutOneSignal();
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

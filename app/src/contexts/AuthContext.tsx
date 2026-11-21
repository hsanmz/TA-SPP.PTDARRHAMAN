import { useAuth as useCoreAuth } from "@/lib/useAuth";
import { logout as coreLogout } from "@/lib/auth-functions";

export function useAuth() {
  const auth = useCoreAuth();
  return {
    ...auth,
    logout: async () => {
      await coreLogout().catch(() => {});
    },
  };
}

export default useAuth;

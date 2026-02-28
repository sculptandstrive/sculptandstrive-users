import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  // console.log(user)
  const isTrialUser = user?.user_metadata?.signup_source === "trial_user";
  const expiryAt = user?.user_metadata?.expiry_at ? new Date(user.user_metadata.expiry_at) : null;
  const currTime = new Date()
  // console.log(user?.user_metadata?.expiry_at, "\n", currTime);
  const isExpiredUser = expiryAt ? expiryAt < currTime: false;
  // console.log(isExpiredUser);

  const location = useLocation();

  let restrictedPaths = [];

  if(isTrialUser){

    restrictedPaths = ["/sessions", "/nutrition", "/progress"];

    if(isExpiredUser){
      restrictedPaths.push('/fitness')
    }
  }
  else{
    if(isExpiredUser)
      restrictedPaths = ["/sessions", "/nutrition", "/progress", '/fitness'];
  }

  if(restrictedPaths.includes(location.pathname)){
    return <Navigate to = "/" replace />
  }

  

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

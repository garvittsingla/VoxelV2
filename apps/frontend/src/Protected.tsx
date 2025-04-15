import { useEffect } from "react";
import { useSession } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) return null; 

  if (isSignedIn) {
    return <>{children}</>;
  }

  return null;
}

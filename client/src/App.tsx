import { useEffect, useRef } from "react";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes";
import { Spinner } from "./components/ui/spinner";
import Logo from "./components/logo";
import { useLocation } from "react-router-dom";
import { isAuthRoute } from "./routes/routes";
import { useSocket } from "./hooks/useSocket";

function App() {
  const { pathname } = useLocation();
  const { user, isAuthStatus, isAuthStatusLoading } = useAuth();
  const { connectSocket, socket } = useSocket();
  const isAuth = isAuthRoute(pathname);
  const hasConnected = useRef(false);

  useEffect(() => {
    console.log("App useEffect - isAuth:", isAuth, "current user:", user);
    if (isAuth) return;
    console.log("Calling isAuthStatus...");
    isAuthStatus();
  }, [isAuthStatus, isAuth]);

  // Connect socket only once when user is available
  useEffect(() => {
    if (user && !socket?.connected && !hasConnected.current) {
      console.log("🔵 User detected, connecting socket...");
      hasConnected.current = true;
      connectSocket();
    }
  }, [user, socket, connectSocket]);

  useEffect(() => {
    console.log("User state changed in App:", user);
  }, [user]);

  useEffect(() => {
    (window as any).debug = {
      socket: () => console.log("Socket state:", useSocket.getState()),
      auth: () => console.log("Auth state:", useAuth.getState()),
      connectSocket: () => useSocket.getState().connectSocket(),
    };
  }, []);

  if (isAuthStatusLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Logo imgClass="size-20" showText={false} />
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;

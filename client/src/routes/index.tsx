import BaseLayout from "@/layouts/base-layout";
import { Route, Routes } from "react-router-dom";
import { authRoutesPaths, protectedRoutesPaths } from "./routes";
import AppLayout from "@/layouts/app-layout";
import RouteGuard from "./route-guard";


const AppRoutes = () => {
    
    return (
        
        <Routes>

            {/* Auth/Public routes */}

            <Route path="/" element={<RouteGuard requiredAuth={false}/>}>
                <Route element={<BaseLayout />}>
                    {authRoutesPaths?.map((route)=>(
                        <Route key={route.path} path={route.path} element={route.element}/>
                    ))}
                </Route>
            </Route>

            {/* Protected routes */}

            <Route path="/" element={<RouteGuard requiredAuth={true}/>}>
                <Route element={<AppLayout />}>
                    {protectedRoutesPaths?.map((route)=>(
                        <Route key={route.path} path={route.path} element={route.element}/>
                    ))}
                </Route>
            </Route>
            
        </Routes>

    )
}
export default AppRoutes;


/*import { Navigate, Outlet } from "react-router-dom";

const RouteGuard = ({ requiredAuth }: Props) => {
    const isLoggedIn = false; // replace with real auth logic

    if (requiredAuth && !isLoggedIn) {
        return <Navigate to="/" />;
    }

    if (!requiredAuth && isLoggedIn) {
        return <Navigate to="/chat" />;
    }

    return <Outlet />;
}; */
import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

// Establishes a global auth state accessible throughout the app
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    axios.defaults.headers.common["Authorization"] = auth?.token;

    // On mount, loads saved auth data from localStorage to maintain sessions across page refreshes
    useEffect(() => {
       const data = localStorage.getItem("auth");
       if (data) {
        const parseData = JSON.parse(data);
        setAuth({
            ...auth,
            user: parseData.user,
            token: parseData.token,
        });
       }
       //eslint-disable-next-line
    }, []);
    // Any component inside {children} can access auth and setAuth via useAuth() hook
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export {useAuth, AuthProvider};
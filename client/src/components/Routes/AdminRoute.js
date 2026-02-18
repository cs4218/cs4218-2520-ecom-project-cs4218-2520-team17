import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function AdminRoute() {
    const [result, setResult] = useState(undefined);
    const [auth] = useAuth()

    useEffect(() => {
        const authCheck = async () => {
          try {
            const res = await axios.get("/api/v1/auth/admin-auth");
            setResult(res.data?.ok === true);
          } catch (error) {
            console.error("Admin auth check failed:", error);
            setResult(false);
          }
        };

        if (auth?.token) authCheck();
    }, [auth?.token]);

    if (result === undefined) {
      return <Spinner />;
    }

    return result ? <Outlet /> : <h1 className="text-center">Unauthorized</h1>;
}

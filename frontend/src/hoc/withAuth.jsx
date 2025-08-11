// withAuth.js
import { useGlobalContext } from "@/contexts/Global";
import { useEffect, useState } from "react";

export default function withAuth(Component) {
  return function WithAuthWrapper(props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, setUser } = useGlobalContext();

    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            credentials: "include", // important for sending cookies
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) throw new Error("Not authenticated");

          const data = await res.json();
          setUser(data?.user);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Unauthorized: {error}</div>;

    return <Component {...props} user={user} />;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { createContext, useEffect, useState, type ReactNode } from "react";
import { Request } from "../utils/Request";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

 const AuthContext:any = createContext(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
    const [user, setUser] = useState<any>(null)
    const [activeMenuKey, setActiveMenuKey] = useState();
    const [permissions, setPermissions] = useState<any[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const navigate:any = useNavigate();

    const getUser = async() => {
        try {
            const userData = await Request.get('/v1/api/auth/me')
            if(!userData){
                localStorage.clear();
                navigate("/login");    
            }
            setUser(userData.data)
            setPermissions(userData.data?.permissions ?? [])
            return userData.data;
        } catch (error) {
            console.log(error);
            navigate("/login");   
        }
    }

    const logout = () => {
        localStorage.clear()
        setUser(null)
        setPermissions([])
        navigate("/login");
    }

    useEffect(() => {
      getUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, permissions, setPermissions, messageApi, logout, isAuthenticated: !!user, activeMenuKey, setActiveMenuKey, getUser }}>
            {contextHolder}
            {children}
        </AuthContext.Provider>
    )
}

export {AuthContext};
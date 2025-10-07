import { jwtDecode } from "jwt-decode";


export const getToken = () => {
    return localStorage.getItem('token');
};


export const setToken = (token) => {
    localStorage.setItem('token', token);
};


export const removeToken = () => {
    localStorage.removeItem('token');
};


export const isAuthenticated = () => {
    const token = getToken();
    return !!token && !isTokenExpired();
};


export const isTokenExpired = () => {
    const token = getToken();
    if (!token) return true;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            removeToken();
            return true;
        }
        return false;
    } catch {
        removeToken();
        return true;
    }
};
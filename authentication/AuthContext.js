// Lähteenä: https://firebase.google.com/docs/auth/web/password-auth
// Tieto sovellukselle siitä, onko käyttäjä kirjautunut sisään vai ei

import { createContext, useEffect, useState } from "react";
import { app } from "../firebaseConfig";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const auth = getAuth(app);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kuunnellaan käyttäjän kirjautumistilan muutoksia (sisään/ulos)
        const unsubscribe = onAuthStateChanged(auth, (currentUser) =>{
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe(); // Lopetetaan kuuntelu komponentin purkautuessa
    }, []);


    // Kirjautumistoiminto
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Rekisteröitymistoiminto
    const register = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    // Uloskirjautumistoiminto
    const logout = () => {
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {/* Näytetään lapset vasta, kun lataus on valmis */}
            {!loading && children}
        </AuthContext.Provider>
    );

};
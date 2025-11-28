// Lähteenä: https://firebase.google.com/docs/auth/web/password-auth
// Tieto sovellukselle siitä, onko käyttäjä kirjautunut sisään vai ei

import { createContext, useEffect, useState } from "react";
import { app, db } from "../firebaseConfig";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const auth = getAuth(app);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        // Kuunnellaan käyttäjän kirjautumistilan muutoksia (sisään/ulos)
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) =>{
            setUser(currentUser);
            console.log('Auth state changed. Current user:', currentUser);


            // Haetaan käyttäjäprofiili Firestoresta sisäänkirjautumisen yhteydessä
            if (currentUser) {
                const userDoc = doc(db, 'users', currentUser.uid);
                const snapshot = await getDoc(userDoc);

                if (snapshot.exists()) {
                    setProfile(snapshot.data());
                } else {
                    // Jos profiilia ei löydy dokumentilla uid-avain, etsitään mahdollinen auto-id-dokumentti
                    // jossa kenttä 'uid' vastaa currentUser.uid (tapaus, jos profiili luotiin addDoc:lla)
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('uid', '==', currentUser.uid));
                    const qSnap = await getDocs(q);
                    if (!qSnap.empty) {
                        const firstDoc = qSnap.docs[0];
                        const data = firstDoc.data();
                        setProfile(data);
                        try {
                            await setDoc(userDoc, data);
                        } catch (e) {
                            console.warn('Failed to migrate user profile to uid-doc:', e);
                        }
                    } else {
                        setProfile(null);
                    }
                }
            }

            
            setLoading(false);
        });
        return () => unsubscribe(); // Lopetetaan kuuntelu komponentin purkautuessa
    }, []);


    // Kirjautumistoiminto
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Rekisteröitymistoiminto
    const register = async (email, password, firstName, lastName, birthDate) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            firstName: firstName,
            lastName: lastName,
            birthDate: birthDate.toISOString(),
            email: email,
            createdAt: new Date().toISOString(),
        });

        return cred;
    };

    // Uloskirjautumistoiminto
    const logout = () => {
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, profile }}>
            {/* Näytetään lapset vasta, kun lataus on valmis */}
            {!loading && children}
        </AuthContext.Provider>
    );

};
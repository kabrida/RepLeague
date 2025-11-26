import { useContext, useState } from "react";
import { AuthContext } from "./AuthContext"
import { Pressable, Text, TextInput, View, Image } from "react-native";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";


export default function LoginScreen({ navigation }) {
    // Haetaan login funktio AuthContextista
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    // Käyttäjän painaessa LOGIN
    const handleLogin = async () => {
        setError(null); // Nollataan mahdollinen aiempi virhe
        try {
            // Kutsutaan Firebase Auth -kirjautumista
            await login(email, password);
        } catch (e) {
            setError('Login failed. Please check your credentials and try again.');
            console.error('Login error: ', e.message);
        }
    };

    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Login</Text>

            <TextInput 
                style={globalStyles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.text}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={text => setEmail(text.trim())}
            />

            <TextInput 
                style={globalStyles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.text}
                secureTextEntry
                value={password}
                onChangeText={text => setPassword(text)}
            />

            {/* Näytetään virheviesti, jos kirjautuminen epäonnistuu */}
            {error && <Text style={globalStyles.errorText}>{error}</Text>}


            <Pressable style={[globalStyles.button, globalStyles.saveButton]} onPress={handleLogin}>
                <Text style={globalStyles.buttonText}>LOGIN</Text>
            </Pressable>

        <View style= {{ flexDirection: 'row', marginTop: 20, justifyContent: 'center' }}>
            <Text style={globalStyles.italicText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate("Register")}>
                <Text style={globalStyles.link}>Register</Text>
            </Pressable>
        </View>
        <View style={{ alignItems: 'center', marginTop: 50 }}><Image source={require('../assets/RL-splash-icon.png')} style={{ width: 200, height: 200 }} /></View>
        </View>
    );
};
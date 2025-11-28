// https://github.com/react-native-datetimepicker/datetimepicker
// https://firebase.google.com/docs/auth/admin/errors

import { useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import { Modal, Platform, Pressable, Text, TextInput, View, Image } from "react-native";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen({ navigation }) {
    const { register } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const [error, setError] = useState(null);

    const onChangeDate = (event, selectedDate) => {
        setShow(Platform.OS === 'ios');
        if (selectedDate) {
            setBirthDate(selectedDate);
        }
    };

    const handleRegister = async () => {
        setError(null); // Nollataan mahdollinen aiempi virhe

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }


        try {
            // Luodaan käyttäjä Firebase Authiin ja profiili AuthContextin register-funktiolla
            const userCredential = await register(email, password, firstName, lastName, birthDate);
            console.log('User registered and profile created successfully', userCredential.user.uid);
            navigation.navigate("Login"); // Ohjataan käyttäjä login-näytölle rekisteröinnin jälkeen
        } catch (e) {
            // Tarkastetaan virheen tyyppi
            if (e.code === 'auth/email-already-exists') {
                setError('The email address is already in use by another account.');
            } else if (e.code === 'auth/invalid-email') {
                setError('The email address is not valid.');
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return ( 
        <View style={globalStyles.container}>

            <TextInput 
                style={globalStyles.input}
                placeholder="First Name"
                placeholderTextColor={COLORS.text}
                value={firstName}
                onChangeText={text => setFirstName(text.trim())}
            />

            <TextInput
                style={globalStyles.input}
                placeholder="Last Name"
                placeholderTextColor={COLORS.text}
                value={lastName}
                onChangeText={text => setLastName(text.trim())}
            />

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

            <TextInput
                style={globalStyles.input}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.text}
                secureTextEntry
                value={confirmPassword}
                onChangeText={text => setConfirmPassword(text)}
            />

            <Pressable style={globalStyles.input} onPress={() => setShow(true)}>
                <Text style={{color: COLORS.text }}>Birth Date</Text>
            </Pressable>

            <Modal visible={show} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: COLORS.text, padding: 20 }}>
                        <DateTimePicker
                            value={birthDate || new Date()}
                            mode="date"
                            display="spinner"
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                            />
                        <Pressable style={[globalStyles.button, globalStyles.saveButton, { marginTop: 10, minHeight: 50, marginBottom: 20 }]} onPress={() => setShow(false)}>
                            <Text style={globalStyles.buttonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {error && <Text style={globalStyles.errorText}>{error}</Text>}

            <Pressable style={[globalStyles.button, globalStyles.saveButton]} onPress={handleRegister}>
                <Text style={globalStyles.buttonText}>REGISTER</Text>
            </Pressable>


            <View style= {{ flexDirection: 'row', marginTop: 20, justifyContent: 'center' }}>
            <Text style={globalStyles.italicText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={globalStyles.link}>Login</Text>
            </Pressable>
            </View>
        <View><Image source={require('../assets/RL-splash-icon.png')} style={{ width: 180, height: 180, alignSelf: 'center', marginTop: 50 }} /></View>
        </View>
    )
};
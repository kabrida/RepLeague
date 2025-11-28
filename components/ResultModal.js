import { addDoc, collection } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { Modal, Pressable, TextInput, View, Text, Platform, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback } from "react-native";
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from "../styles/theme";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../authentication/AuthContext";

export default function ResultModal({ visible, onClose, workout }) {
    const [time, setTime] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg'); // Oletuksena kilot

    const { user } = useContext(AuthContext);

    useEffect(() => {
        // Päivitetään inputit aina kun workout muuttuu
        setTime('');
        setReps('');
        setWeight('');
        setNotes('');
    }, [workout]);

    const getResultType = (mode) => {
        // Liittyen treenin "mode"-kenttään, määritellään tulostyypit, jotka käyttäjä syöttää
        // For time -> aika
        // AMRAP/EMOM -> toistot
        // Voima -> painot
        // Muut -> yleinen
        if (!mode) return 'generic';
        const lowerMode = mode.toLowerCase();
        if (lowerMode.includes('for time')) return 'time';
        if (lowerMode.includes('amrap') || lowerMode.includes('emom')) return 'reps';
        if (lowerMode.includes('weight') || lowerMode.includes('strength') || lowerMode.includes('lift')) return 'weight';
        return 'generic';
    }

    const resultType = getResultType(workout?.mode);

    const handleSave = async () => {
        const workoutId = workout?.firestoreId || workout?.id;
      
        if (!user) {
            console.error('User is not logged in');
            return;
        }
      
        if (!workoutId) {
            console.error('Workout ID is missing');
            return;
        }

        // Validointi syötteelle: tulos on annettava riippuen tulostyypistä
        if (resultType === 'time' && !time.trim()) {
            alert('Please enter the time for this workout.');
            return;
        }

        if (resultType === 'reps' && !reps.trim()) {
            alert('Please enter the number of reps for this workout.');
            return;
        }
        
        if (resultType === 'weight' && !weight.trim()) {
            alert('Please enter the weight for this workout.');
            return;
        }

        // Luodaan tulosobjekti syötteiden perusteella
        const newResult = {
            workoutId,
            userId: user.uid,
            date: new Date().toISOString(),
            result: {
                status: resultType === 'generic' ? 'COMPLETED' : null,
                time: resultType === 'time' ? time.trim() : null,
                reps: resultType === 'reps' ? parseInt(reps.trim()) : null,
                weight: resultType === 'weight' ? parseFloat(weight.trim()) : null,
                weightUnit: resultType === 'weight' ? weightUnit : null,
            },
            notes: notes.trim() || null,
        };

        try {
            // Tallennetaan tulos Firestoreen
            await addDoc(collection(db, 'results'), newResult);
            console.log('Result saved successfully');

            setTime('');
            setReps('');
            setWeight('');
            setNotes('');
            onClose();
        } catch (e) {
            console.error('Error saving result: ', e);
            alert('Error saving result');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
                style={globalStyles.addWorkoutModalContainer}
                contentContainerStyle={{ flexGrow: 1, padding: 20, alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
            >
    
            <View style={globalStyles.overlay}>
                <View style={globalStyles.modalContainer}>
                    <Text style={globalStyles.modalTitle}>Add Result for {workout?.name}</Text>

                    {resultType === 'time'  && (
                        <TextInput 
                            style={globalStyles.input}
                            placeholder="Time (e.g., 10:30)"
                            placeholderTextColor={COLORS.placeholder}
                            value={time}
                            onChangeText={setTime}
                        />
                    )}

                    {resultType === 'reps' && (
                        <TextInput 
                            style={globalStyles.input}
                            placeholder="Reps (e.g., 150)"
                            placeholderTextColor={COLORS.placeholder}
                            value={reps}
                            onChangeText={setReps}
                            keyboardType="numeric"
                        />
                    )}

                    {resultType === 'weight' && (
                        <View style={{ marginBottom: 10 }}>
                        <TextInput
                            style={globalStyles.input}
                            placeholder="Weight (e.g., 200)"
                            placeholderTextColor={COLORS.placeholder}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />
                        <View style={{ ...globalStyles.input, paddingHorizontal: 0, justifyContent: 'center', overflow: 'hidden' }}>
                            <Picker
                                selectedValue={weightUnit}
                                dropdownIconColor={COLORS.text}
                                onValueChange={(itemValue) => setWeightUnit(itemValue)}
                                mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
                            >
                                <Picker.Item label="kg" value="kg" />
                                <Picker.Item label="lbs" value="lbs" />
                            </Picker>
                        </View>
                        </View>
                    )}

                    <TextInput
                        style={globalStyles.input}
                        placeholder="Notes..."
                        placeholderTextColor={COLORS.placeholder}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                    />

                    <View style={globalStyles.buttonContainer}>
                        <Pressable style={[globalStyles.button, globalStyles.cancelButton]} onPress={onClose}>
                            <Text style={globalStyles.buttonText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={[globalStyles.button, globalStyles.saveButton]} onPress={handleSave}>
                            <Text style={globalStyles.buttonText}>Save</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            </KeyboardAwareScrollView>
            </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    )

}

 
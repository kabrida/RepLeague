import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebaseConfig";
import { Modal, Pressable, TextInput, View, Text } from "react-native";
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from "../styles/theme";

export default function ResultModal({ visible, onClose, workout }) {
    const [time, setTime] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

    const getResultType = (mode) => {
// Liittyen treenin "mode"-kenttään, määritellään tulostyypit, jotka käyttäjä syöttää
// For time -> aika
// AMRAP/EMOM -> toistot
// Voima -> painot
// Muut -> yleinen ('COMPLETED')
        if (!mode) return 'generic';
        const lowerMode = mode.toLowerCase();
        if (lowerMode.includes('for time')) return 'time';
        if (lowerMode.includes('amrap') || lowerMode.includes('emom')) return 'reps';
        if (lowerMode.includes('weight') || lowerMode.includes('strength') || lowerMode.includes('lift')) return 'weight';
        return 'generic';
    }

    const resultType = getResultType(workout?.mode);

    const handleSave = async () => {
        if (!workout.id) {
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
    
        let newResult = {};

        if (resultType === 'generic') {
            // Jos tulostyyppi on yleinen, tallennetaan vain 'COMPLETED'
            newResult = {
                workoutId: workout.id,
                date: new Date().toISOString(),
                result: {
                    status: 'COMPLETED',
                },
                notes: notes || '',
                };
        } else {
            newResult = {
                workoutId: workout.id,
                date: new Date().toISOString(),
                result: {
                    time: time || null,
                    reps: reps || null,
                    weight: weight || null,
                },
                notes: notes || '',
            };
        }

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
                        <TextInput
                            style={globalStyles.input}
                            placeholder="Weight (e.g., 200)"
                            placeholderTextColor={COLORS.placeholder}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                        />
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
        </Modal>
    )

}

 
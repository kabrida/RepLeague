import { updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { Modal, Pressable, TextInput, View, Text, Platform, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback } from "react-native";
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from "../styles/theme";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function EditResultModal({ visible, onClose, result }) {
    const [time, setTime] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [weightUnit, setWeightUnit] = useState('kg');

    // Alustetaan kentät nykyisillä arvoilla

    useEffect(() => {
        if (result) {
            setTime(result.time ?? '');
            setReps(result.reps ? String(result.reps) : '');
            setWeight(result.weight ? String(result.weight) : '');
            setNotes(result.notes ?? '');
            setWeightUnit(result.weightUnit ?? 'kg');
        }
    }, [result]);

    // Päätellään mitä kenttää tulee näyttää
    const resultType = 
        result?.reps !== null ? 'reps' :
        result?.time !== null ? 'time' :
        result?.weight !== null ? 'weight' :
        'generic';

        // Tallennetaan muokatut tulokset
        const handleUpdate = async () => {
            // Validointi syötteille
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

            try {
                const updatedData = {
                    date: result.date,
                    notes: notes.trim() || '',
                    result: {
                        reps: resultType === 'reps' ? parseInt(reps) : null,
                        time: resultType === 'time' ? time.trim() : null,
                        weight: resultType === 'weight' ? parseFloat(weight) : null,
                        weightUnit: resultType === 'weight' ? weightUnit : null,
                    }
                };

                console.log("Document ref test:", doc(db, 'results', result.id));
                await updateDoc(doc(db, 'results', result.id), updatedData);
                console.log('Result updated successfully');
                // Rakenna päivitetty tulosobjekti palautettavaksi parent-komponentille
                const updatedResult = {
                    id: result.id,
                    date: updatedData.date,
                    reps: updatedData.result.reps,
                    time: updatedData.result.time,
                    weight: updatedData.result.weight,
                    weightUnit: updatedData.result.weightUnit,
                    notes: updatedData.notes,
                    workoutName: result.workoutName ?? result.workoutName,
                    workoutMode: result.workoutMode ?? null,
                    workoutId: result.workoutId ?? null,
                };
                onClose(updatedResult);
            } catch (e) {
                console.error('Error updating result: ', e);
                alert('Error updating result');
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
                    {/* Modalin sisältö tulee tänne, samanlainen kuin ResultModalissa, mutta tallennus kutsuu handleUpdate-funktiota */}
                    <View style={globalStyles.overlay}>
                        <View style={globalStyles.modalContainer}>
                            <Text style={globalStyles.modalTitle}>Edit Result for {result?.workoutName}</Text>
                            
                            {resultType === 'time'  && (
                                <TextInput
                                    style={globalStyles.input}
                                    placeholder="Time (e.g., 00:45)"
                                    value={time}
                                    onChangeText={setTime}
                                    placeholderTextColor={COLORS.placeholder}
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
                                <Pressable style={[globalStyles.button, globalStyles.cancelButton]} onPress={() => onClose()}>
                                    <Text style={globalStyles.buttonText}>Cancel</Text>
                                </Pressable>
                                <Pressable style={[globalStyles.button, globalStyles.saveButton]} onPress={handleUpdate}>
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
        };

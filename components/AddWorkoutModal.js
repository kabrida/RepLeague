// Lähteenä: https://docs.expo.dev/versions/latest/sdk/picker/
// https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/keyboard-aware-scroll-view

import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Modal, Pressable, TextInput, View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { db } from "../firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";


export default function AddWorkoutModal({ visible, onClose, setWorkouts }) {
    const [newWorkout, setNewWorkout] = useState({
        name: '',
        mode: '',
        equipment: [],
        exercises: [],
        trainerTips: []
    });

    // Tyhjentää lomakkeen kentät
    const resetForm = () => {
        setNewWorkout({
            name: '',
            mode: '',
            equipment: [],
            exercises: [],
            trainerTips: []
        });
    }

    const handleChange = (key, value) => {
        setNewWorkout(prev => ({ ...prev, [key]: value }) );
    };

    // Käsittelee taulukkomuuttujien päivitykset
    const handleArrayChange = (key, value, index) => {
        const updatedArray = [...newWorkout[key]];
        updatedArray[index] = value;
        setNewWorkout(prev => ({ ...prev, [key]: updatedArray }) );
    };


    // Lisää uusi tyhjä kenttä taulukkomuuttujaan
    const addArrayItem = (key) => {
        setNewWorkout(prev => ({ ...prev, [key]: [...prev[key], ''] }) );
    };


    // Poistaa kentän taulukkomuuttujasta
    const removeArrayItem = (key, index) => {
        const updatedArray = [...newWorkout[key]];
        updatedArray.splice(index, 1);
        setNewWorkout(prev => ({ ...prev, [key]: updatedArray }) );
    };

    // Tallenna uusi treeni Firestoreen
    const handleSubmit = async () => {
        const { name, mode, equipment, exercises, trainerTips } = newWorkout;

        // Validointi ennen tallennusta
        if(!name.trim()) {
            Alert.alert('Validation Error', 'Workout name is required.');
            return;
        }

        if(!mode.trim()) {
            Alert.alert('Validation Error', 'Workout mode is required.');
            return;
        }

        if(!exercises.some(ex => ex.trim() !== '')) {
            Alert.alert('Validation Error', 'At least one exercise is required.');
            return;
        }

        if(!trainerTips.some(tip => tip.trim() !== '')) {
            Alert.alert('Validation Error', 'At least one trainer tip is required.');
            return;
        }


        try {
            const workoutsRef = collection(db, 'workouts');
            const modeToSave = newWorkout.mode || 'GENERIC';
            const workoutToSave = { ...newWorkout, mode: modeToSave };

            workoutToSave.equipment = workoutToSave.equipment.filter(e => e.trim() !== '');
            workoutToSave.exercises = workoutToSave.exercises.filter(e => e.trim() !== '');
            workoutToSave.trainerTips = workoutToSave.trainerTips.filter(t => t.trim() !== '');

            await addDoc(workoutsRef, workoutToSave);

            setWorkouts(prev => [...prev, workoutToSave]);
            Alert.alert('Success', 'Workout added successfully!');

            resetForm();
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to add workout. Please try again.');
            console.error('Error adding workout: ', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide">
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
                style={globalStyles.addWorkoutModalContainer}
                contentContainerStyle={{ flexGrow: 1, padding: 20, alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={globalStyles.title}>Add New Workout</Text>

                <TextInput
                    placeholder="Workout Name"
                    placeholderTextColor={COLORS.placeholder}
                    value={newWorkout.name}
                    onChangeText={(text) => handleChange('name', text)}
                    style={globalStyles.input}
                    />

                <View style={{ ...globalStyles.input, paddingHorizontal: 0, justifyContent: 'center', overflow: 'hidden' }}>
                    <Picker
                        selectedValue={newWorkout.mode}
                        onValueChange={(value) => handleChange('mode', value)}
                        dropdownIconColor={COLORS.text}
                        mode={Platform.OS === 'ios' ? 'dialog' : 'dropdown'}
                        >
                        <Picker.Item label="Select Mode" value="" color={COLORS.placeholder} />
                        <Picker.Item label="AMRAP" value="AMRAP" color={COLORS.text} />
                        <Picker.Item label="EMOM" value="EMOM" color={COLORS.text} />
                        <Picker.Item label="For Time" value="FOR TIME" color={COLORS.text} />
                        <Picker.Item label="Strength" value="STRENGTH" color={COLORS.text} />
                        <Picker.Item label="Generic" value="GENERIC" color={COLORS.text} />
                        </Picker>

                </View>

                <Text style={globalStyles.sectionLabel}>Equipment:</Text>
                {newWorkout.equipment.map((eq, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Equipment'
                            placeholderTextColor={COLORS.placeholder}
                            value={eq}
                            onChangeText={(text) => handleArrayChange('equipment', text, i)}
                            style={globalStyles.input}
                            />
                            <Pressable style={[globalStyles.cancelButton, globalStyles.button, { marginBottom: 15 }]} onPress={() => removeArrayItem('equipment', i)}><Text style={globalStyles.buttonText}>Remove</Text></Pressable>
                    </View>
                ))}

                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('equipment')}><Text style={globalStyles.addButtonText}> + Add Equipment</Text></Pressable>

                <Text style={globalStyles.sectionLabel}>Exercises:</Text>
                {newWorkout.exercises.map((ex, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Exercise'
                            placeholderTextColor={COLORS.placeholder}
                            value={ex}
                            onChangeText={(text) => handleArrayChange('exercises', text, i)}
                            style={globalStyles.input}
                            />
                            <Pressable style={[globalStyles.cancelButton, globalStyles.button, { marginBottom: 15 }]} onPress={() => removeArrayItem('exercises', i)}><Text style={globalStyles.buttonText}>Remove</Text></Pressable>
                    </View>
                ))}

                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('exercises')}><Text style={globalStyles.addButtonText}> + Add Exercise</Text></Pressable>

                <Text style={globalStyles.sectionLabel}>Trainer Tips:</Text>
                {newWorkout.trainerTips.map((tip, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Trainer Tip'
                            placeholderTextColor={COLORS.placeholder}
                            value={tip}
                            onChangeText={(text) => handleArrayChange('trainerTips', text, i)}
                            style={globalStyles.input}
                            multiline
                            numberOfLines={4}
                            />
                            <Pressable style={[globalStyles.cancelButton, globalStyles.button, { marginBottom: 15 }]} onPress={() => removeArrayItem('trainerTips', i)}><Text style={globalStyles.buttonText}>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('trainerTips')}><Text style={globalStyles.addButtonText}> + Add Trainer Tip</Text></Pressable>

                <View style={{...globalStyles.buttonContainer, marginTop: 30}}>
                    <Pressable style={[globalStyles.cancelButton, globalStyles.button]} onPress={() => { resetForm(); onClose(); }}><Text style={globalStyles.buttonText}>Close</Text></Pressable>
                    <Pressable style={[globalStyles.saveButton, globalStyles.button]} onPress={handleSubmit}><Text style={globalStyles.buttonText}>Submit</Text></Pressable>       
                </View>

            </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        </Modal>
    )
}
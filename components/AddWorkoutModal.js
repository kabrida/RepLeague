import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Modal, Pressable, TextInput, View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { db } from "../firebaseConfig";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";


export default function AddWorkoutModal({ visible, onClose, setWorkouts }) {
    const [newWorkout, setNewWorkout] = useState({
        name: '',
        mode: '',
        equipment: [],
        exercises: [],
        trainerTips: []
    });

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
            const workoutToSave = { ...newWorkout };

            workoutToSave.equipment = workoutToSave.equipment.filter(e => e.trim() !== '');
            workoutToSave.exercises = workoutToSave.exercises.filter(e => e.trim() !== '');
            workoutToSave.trainerTips = workoutToSave.trainerTips.filter(t => t.trim() !== '');

            await addDoc(workoutsRef, workoutToSave);

            setWorkouts(prev => [...prev, workoutToSave]);
            Alert.alert('Success', 'Workout added successfully!');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to add workout. Please try again.');
            console.error('Error adding workout: ', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={globalStyles.container}>
                <Text style={globalStyles.title}>Add New Workout</Text>

                <TextInput
                    placeholder="Workout Name"
                    placeholderTextColor={COLORS.placeholder}
                    value={newWorkout.name}
                    onChangeText={(text) => handleChange('name', text)}
                    style={globalStyles.input}
                    />

                <TextInput
                    placeholder="Workout Mode"
                    placeholderTextColor={COLORS.placeholder}
                    value={newWorkout.mode}
                    onChangeText={(text) => handleChange('mode', text)}
                    style={globalStyles.input}
                    />

                <Text style={COLORS.text}>Equipment:</Text>
                {newWorkout.equipment.map((eq, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Equipment'
                            placeholderTextColor={COLORS.placeholder}
                            value={eq}
                            onChangeText={(text) => handleArrayChange('equipment', text, i)}
                            style={globalStyles.input}
                            />
                            <Pressable style={globalStyles.cancelButton} onPress={() => removeArrayItem('equipment', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('equipment')}><Text style={globalStyles.addButtonText}> + Add Equipment</Text></Pressable>

                <Text style={COLORS.text}>Exercises:</Text>
                {newWorkout.exercises.map((ex, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Exercise'
                            placeholderTextColor={COLORS.placeholder}
                            value={ex}
                            onChangeText={(text) => handleArrayChange('exercises', text, i)}
                            style={globalStyles.input}
                            />
                            <Pressable style={globalStyles.cancelButton} onPress={() => removeArrayItem('exercises', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}

                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('exercises')}><Text style={globalStyles.addButtonText}> + Add Exercise</Text></Pressable>

                <Text style={COLORS.text}>Trainer Tips:</Text>
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
                            <Pressable style={globalStyles.cancelButton} onPress={() => removeArrayItem('trainerTips', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => addArrayItem('trainerTips')}><Text style={globalStyles.addButtonText}> + Add Trainer Tip</Text></Pressable>

                <View style={{...globalStyles.buttonContainer, marginTop: 30}}>
                    <Pressable style={[globalStyles.cancelButton, globalStyles.button]} onPress={onClose}><Text style={globalStyles.buttonText}>Close</Text></Pressable>
                    <Pressable style={[globalStyles.saveButton, globalStyles.button]} onPress={handleSubmit}><Text style={globalStyles.buttonText}>Submit</Text></Pressable>       
                </View>

            </ScrollView>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        flexGrow: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        minWidth: 400,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    addButton: {
        marginVertical: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: 'blue',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    removeButton: {
        alignSelf: 'center',
        marginVertical: 5,
        padding: 5,
        backgroundColor: 'red',
        borderRadius: 5,
    },
    submitButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'green',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        marginTop: 10,
        padding: 15,
        backgroundColor: 'gray',
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
});

import { collection, addDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Modal, Pressable, TextInput, View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { db } from "../firebaseConfig";


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
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Add New Workout</Text>

                <TextInput
                    placeholder="Workout Name"
                    value={newWorkout.name}
                    onChangeText={(text) => handleChange('name', text)}
                    style={styles.input}
                    />

                <TextInput
                    placeholder="Workout Mode"
                    value={newWorkout.mode}
                    onChangeText={(text) => handleChange('mode', text)}
                    style={styles.input}
                    />

                <Text>Equipment:</Text>
                {newWorkout.equipment.map((eq, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Equipment'
                            value={eq}
                            onChangeText={(text) => handleArrayChange('equipment', text, i)}
                            style={styles.input}
                            />
                            <Pressable style={styles.removeButton} onPress={() => removeArrayItem('equipment', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={styles.addButton} onPress={() => addArrayItem('equipment')}><Text style={styles.addButtonText}> + Add Equipment</Text></Pressable>

                <Text>Exercises:</Text>
                {newWorkout.exercises.map((ex, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Exercise'
                            value={ex}
                            onChangeText={(text) => handleArrayChange('exercises', text, i)}
                            style={styles.input}
                            />
                            <Pressable style={styles.removeButton} onPress={() => removeArrayItem('exercises', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={styles.addButton} onPress={() => addArrayItem('exercises')}><Text style={styles.addButtonText}> + Add Exercise</Text></Pressable>

                <Text>Trainer Tips:</Text>
                {newWorkout.trainerTips.map((tip, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder='Trainer Tip'
                            value={tip}
                            onChangeText={(text) => handleArrayChange('trainerTips', text, i)}
                            style={styles.input}
                            />
                            <Pressable style={styles.removeButton} onPress={() => removeArrayItem('trainerTips', i)}><Text>Remove</Text></Pressable>
                    </View>
                ))}
                <Pressable style={styles.addButton} onPress={() => addArrayItem('trainerTips')}><Text style={styles.addButtonText}> + Add Trainer Tip</Text></Pressable>

                <Pressable style={styles.submitButton} onPress={handleSubmit}><Text>Submit</Text></Pressable>
                <Pressable style={styles.closeButton} onPress={onClose}><Text>Close</Text></Pressable>

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

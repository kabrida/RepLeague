// Lähteenä: 
// https://docs.expo.dev/versions/latest/sdk/async-storage/
// https://firebase.google.com/docs/firestore/quickstart

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, Pressable } from 'react-native';
import wodApi from '../api/wodApi';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddWorkoutModal from './AddWorkoutModal';

export default function HomeScreen() {
    const [workouts, setWorkouts] = useState([]);
    const [dailyWorkout, setDailyWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {

        // Haetaan WODit ulkoisesta API:sta ja tallennetaan Firestoreen, jos niitä ei vielä ole tallennettuna
        const fetchAndStoreWorkouts = async () => {
            try {
                const workoutsRef = collection(db, 'workouts'); // Firestore-kokoelma nimeltä 'workouts'
                const snapshot = await getDocs(workoutsRef); // Haetaan dokumentit kokoelmasta

             // Jos kokoelmassa on jo treenejä, ei haeta API:sta uudelleen
                if(!snapshot.empty) {
                    console.log('Workouts loaded from Firestore');
                    const existingWorkouts = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setWorkouts(existingWorkouts);
                     await chooseDailyWorkout(existingWorkouts);
                } else {
                    // Jos kokoelma on tyhjä, haetaan API:sta
                    console.log('Fetching workouts from API');
                    const response = await wodApi.get('/workouts');
                    const fetchedWorkouts = response.data.data;

                    // Tallennetaan haetut treenit Firestoreen
                    for (const workout of fetchedWorkouts) {
                        await addDoc(workoutsRef, workout);
                    }

                    setWorkouts(fetchedWorkouts);
                    await chooseDailyWorkout(fetchedWorkouts);
                    console.log('Workouts saved to Firestore');
                }
        

            } catch(e) {
                console.error('Error fetching or storing workouts: ', e);
            } finally {
                setLoading(false);
            }

        };


        // Arvotaan päivän treeni ja tallennetaan se AsyncStorageen
        const chooseDailyWorkout = async (workouts) => {
            const storedDate = await AsyncStorage.getItem('dailyWorkoutDate');
            const storedWorkout = await AsyncStorage.getItem('dailyWorkout');
            const today = new Date().toDateString();

            // Jos tallennettu päivämäärä on sama kuin tänään, käytetään tallennettua treeniä
            if (storedDate === today && storedWorkout) {
                setDailyWorkout(JSON.parse(storedWorkout));
                return;
            }

            const randomWorkout = workouts[Math.floor(Math.random() * workouts.length)];
            setDailyWorkout(randomWorkout);


            await AsyncStorage.setItem('dailyWorkoutDate', today);
            await AsyncStorage.setItem('dailyWorkout', JSON.stringify(randomWorkout));
        }

        fetchAndStoreWorkouts();

    }, []);

    const handleSearch = (text) => {

        setSearchTerm(text);
        // Suodatetaan treenit hakusanalla joko nimen, tyypin tai liikkeen perusteella

        if (text.trim() === '') {
            setFilteredWorkouts([]);
            return;
        }


        const filtered = workouts.filter(w =>
            w.name.toLowerCase().includes(text.toLowerCase()) ||
            (w.mode && w.mode.toLowerCase().includes(text.toLowerCase())) ||
            (w.exercises && w.exercises.some(ex => ex.toLowerCase().includes(text.toLowerCase())))
        );
        setFilteredWorkouts(filtered);
    };

    if (loading) {
        return (
            <View>
                <ActivityIndicator size="large" color="#34b3e6ff" />
                <Text>Loading workouts...</Text>
            </View>
        )
    }


    return (
    <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>

            <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}><Text style={styles.addButtonText}>Add New Workout</Text></Pressable>
            <AddWorkoutModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
                setWorkouts={setWorkouts}
                />

            <Text style={[styles.title, {marginTop: 40}]}>Search workout:</Text>
            <TextInput
                placeholder='Search workouts...'
                value={searchTerm}
                onChangeText={handleSearch}
                />


        {filteredWorkouts.length > 0 && (
            <FlatList
            contentContainerStyle={styles.listContainer}
                data={searchTerm.trim() === '' ? workouts : filteredWorkouts}
                keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
                renderItem={({ item }) => (
                    <View style={[styles.item, {marginTop: 10}]}>
                        <Text style={styles.workoutName}>{item.name}</Text>
                        <Text style={styles.workoutMode}>{item.mode}</Text>

                    <View style={styles.textContainer}>
                        {item.exercises && item.exercises.map((ex, i) => (
                            <Text key={i} style={styles.exerciseText}>• {ex}</Text>
                        ))}
                    </View>

                    <View style={styles.textContainer}>
                        {item.trainerTips && item.trainerTips.map((tip, i) => (
                            <Text key={i} style={styles.tipText}>- {tip}</Text>
                        ))}
                    </View>
                    </View>
                )}
            />
        )}

        <Text style={styles.title}>Daily Workout:</Text>

            {dailyWorkout ? (
                <View style={styles.item}>
                    <Text style={styles.workoutName}>{dailyWorkout.name}</Text>
                    <Text style={styles.workoutMode}>{dailyWorkout.mode}</Text>

                    <View style={styles.textContainer}>
                    {dailyWorkout.exercises && dailyWorkout.exercises.map((ex, i) => (
                        <Text key={i} style={styles.exerciseText}>• {ex}</Text>
                    ))}
                    </View>

                    <View style={styles.textContainer}>
                    {dailyWorkout.trainerTips && dailyWorkout.trainerTips.map((tip, i) => (
                        <Text key={i} style={styles.tipText}>- {tip}</Text>
                    ))}
                    </View>

                    </View>
            ) : (<Text>No workout available</Text>
            )}

          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
        flexGrow: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingBottom: 100,
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 80,
        color: '#000000ff',
    },
    item: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        minWidth: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginVertical: 10,
    },
    workoutName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    workoutMode: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
    },
    exerciseText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    tipText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
        marginBottom: 2,
    },
    textContainer: {
        marginBottom: 20,
    },
    separator: {
        height: 10,
    },
    addButton: {
        backgroundColor: '#34e6ddff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
})
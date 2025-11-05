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
import ResultModal from './ResultModal';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../styles/theme';

export default function HomeScreen() {
    const [workouts, setWorkouts] = useState([]);
    const [dailyWorkout, setDailyWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredWorkouts, setFilteredWorkouts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedWorkout, setSelectedWorkout] = useState(null);

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
        <View style={globalStyles.container}>

        <Text style={globalStyles.title}>Daily Workout:</Text>

            {dailyWorkout ? (
                <View style={globalStyles.item}>
                    <Text style={globalStyles.workoutName}>{dailyWorkout.name}</Text>
                    <Text style={globalStyles.workoutMode}>{dailyWorkout.mode}</Text>

                    <View style={globalStyles.textContainer}>
                    {dailyWorkout.exercises && dailyWorkout.exercises.map((ex, i) => (
                        <Text key={i} style={globalStyles.exerciseText}>• {ex}</Text>
                    ))}
                    </View>

                    <View style={globalStyles.textContainer}>
                    {dailyWorkout.trainerTips && dailyWorkout.trainerTips.map((tip, i) => (
                        <Text key={i} style={globalStyles.tipText}>- {tip}</Text>
                    ))}

                    <Pressable style={globalStyles.addButton} onPress={() => setSelectedWorkout(dailyWorkout)}>
                        <Text style={globalStyles.addButtonText}>Add Result</Text>
                    </Pressable>
                    </View>

                    </View>
            ) : (<Text>No workout available</Text>
            )}

            <Pressable style={{...globalStyles.addButton, width: '100%'}} onPress={() => setModalVisible(true)}><Text style={globalStyles.addButtonText}>Add New Workout</Text></Pressable>
            <AddWorkoutModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
                setWorkouts={setWorkouts}
                />

            <Text style={[globalStyles.title, {marginTop: 40}]}>Search workout:</Text>
            <TextInput
                style={globalStyles.input}
                placeholder='Search workouts...'
                placeholderTextColor={COLORS.placeholder}
                value={searchTerm}
                onChangeText={handleSearch}
                />


        {filteredWorkouts.length > 0 && (
            <FlatList
            contentContainerStyle={globalStyles.listContainer}
                data={searchTerm.trim() === '' ? workouts : filteredWorkouts}
                keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
                renderItem={({ item }) => (
                    <View style={[globalStyles.item, {marginTop: 10}]}>
                        <Text style={globalStyles.workoutName}>{item.name}</Text>
                        <Text style={globalStyles.workoutMode}>{item.mode}</Text>

                    <View style={globalStyles.textContainer}>
                        {item.exercises && item.exercises.map((ex, i) => (
                            <Text key={i} style={globalStyles.exerciseText}>• {ex}</Text>
                        ))}
                    </View>

                    <View style={globalStyles.textContainer}>
                        {item.trainerTips && item.trainerTips.map((tip, i) => (
                            <Text key={i} style={globalStyles.tipText}>- {tip}</Text>
                        ))}
                    </View>
                    <Pressable style={globalStyles.addButton} onPress={() => setSelectedWorkout(item)}>
                        <Text style={globalStyles.addButtonText}>Add Result</Text>
                    </Pressable>
                    </View>
                )}
            />
        )}

        <ResultModal 
            visible={!!selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
            workout={selectedWorkout}
        />

          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}


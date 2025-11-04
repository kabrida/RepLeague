// Lähteennä: https://firebase.google.com/docs/firestore/quickstart

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import wodApi from '../api/wodApi';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function HomeScreen() {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    return;
                }

                // Jos kokoelma on tyhjä, haetaan API:sta
                console.log('Fetching workouts from API');
                const response = await wodApi.get('/workouts');
                const fetchedWorkouts = response.data.data;

                // Tallennetaan haetut treenit Firestoreen
                for (const workout of fetchedWorkouts) {
                    await addDoc(workoutsRef, workout);
                }

                setWorkouts(fetchedWorkouts);
                console.log('Workouts saved to Firestore');
            } catch(e) {
                console.error('Error fetching or storing workouts: ', e);
            } finally {
                setLoading(false);
            }

        };

        fetchAndStoreWorkouts();

    }, []);

    if (loading) {
        return (
            <View>
                <ActivityIndicator size="large" color="#34b3e6ff" />
                <Text>Loading workouts...</Text>
            </View>
        )
    }

    return (
        <View>
            <Text style={styles.title}>Available Workouts:</Text>
            
            <FlatList
                data={workouts}
                keyExtractor={(item) => item.id}
                renderItem={({ item}) => (
                    <View style={styles.item}>
                        <Text style={styles.workoutName}>{item.name}</Text>
                        <Text style={styles.workoutMode}>{item.mode}</Text>

                        
                        {item.exercises && item.exercises.map((exercise, index) => (
                            <Text key={index}>• {exercise} </Text>
                        ))}

                        {item.trainerTips && item.trainerTips.map((tip, index) => (
                                <Text key={index}>💡 {tip}</Text>
                        ))}
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
        
        </View>
    );
}

const styles = StyleSheet.create({
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
    },
    workoutName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    workoutMode: {
        fontSize: 16,
        color: '#555',
    },
    separator: {
        height: 10,
    },
})
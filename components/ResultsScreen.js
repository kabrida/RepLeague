import { Text, View, ActivityIndicator, FlatList } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';

export default function ResultsScreen() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            const unsubscribe = onSnapshot(collection(db, 'results'), async (snapshot) => {
            const data = await Promise.all(snapshot.docs.map(async docSnap => {
            const result = docSnap.data();


            // Haetaan tulokseen liittyvän treenin nimi
            let workoutName = 'Workout';
            if(result.workoutId) {
                try {
                    const workoutSnap = await getDoc(doc(db, 'workouts', result.workoutId));
                    if (workoutSnap.exists()) {
                        workoutName = workoutSnap.data().name;
                    }
                } catch(e) {
                    console.warn('Workout not found with ID', result.workoutId);
                }
            }

            return {
                id: docSnap.id,
                date: result.date,
                notes: result.notes,
                reps: result.result?.reps,
                time: result.result?.time,
                weight: result.result?.weight,
                weightUnit: result.result?.weightUnit,
                workoutName
            };
            }));
            console.log('Fetched results with workout names:', data);
            setResults(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [])


    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#34b3e6ff" />
                <Text style={globalStyles.loadingText}>Loading results...</Text>
            </View>
        )
    }

    return (
        <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Workout Results</Text>

        {results.length === 0 ? (
            <Text style={globalStyles.exerciseText}>No results found.</Text>
        ) : (
            <FlatList
                data={results}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={globalStyles.listContainer}
                renderItem={({ item }) => (
                    <View style={globalStyles.item}>
                       <Text style={globalStyles.workoutName}>{item.workoutName}</Text>
                       <Text style={globalStyles.workoutDate}>Date: {new Date(item.date).toLocaleDateString()}</Text>
                       {item.reps !== null && <Text style={globalStyles.scoreText}>Reps: {item.reps}</Text>}
                       {item.time !== null && <Text style={globalStyles.scoreText}>Time: {item.time}</Text>}
                       {item.weight !== null && <Text style={globalStyles.scoreText}>Weight: {item.weight} {item.weightUnit}</Text>}
                       {item.notes && <Text style={globalStyles.tipText}>Notes: {item.notes}</Text>}
                    </View>
                )}
            />
        )}
        </View>
    );
}
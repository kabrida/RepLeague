import { Text, View, ActivityIndicator, FlatList, Alert, Pressable, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import EditResultModal from './EditResultModal';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme';

export default function ResultsScreen() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortNewestFirst, setSortNewestFirst] = useState(true);

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
    }, []);

    const handleDelete = (resultId) => {
        Alert.alert(
            'Confirm delete',
            'Are you sure you want to remove this result?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'results', resultId));
                        console.log('Result deleted with ID:', resultId);
                        setResults(prevResults => prevResults.filter(result => result.id !== resultId));
                    } catch (e) {
                        console.error('Error deleting result:', e);
                    }
                } }
            ]
        )
    }

    // Suodatetaan tulokset hakukentän perusteella
    const filteredResults = results.filter(result =>
        result.workoutName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedResults = filteredResults.sort((a,b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortNewestFirst ? dateB - dateA : dateA - dateB; // Sortataan uusimmasta vanhimpaan
    })


    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#34b3e6ff" />
                <Text style={globalStyles.loadingText}>Loading results...</Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Workout Results</Text>

        {results.length === 0 ? (
            <Text style={globalStyles.exerciseText}>No results found.</Text>
        ) : (
            <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TextInput 
                placeholder="Search by workout name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={globalStyles.searchResultInput}
                placeholderTextColor={COLORS.placeholder}
            />
            <TouchableOpacity onPress={() => setSortNewestFirst(prev => !prev)} style={{ marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                    name={sortNewestFirst ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
                    size={40}
                    color={COLORS.accent}
                />
            </TouchableOpacity>
            </View>
            <FlatList
                data={sortedResults}
                keyExtractor={(item, index) => item.id || index.toString()}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={[globalStyles.listContainer, { paddingBottom: 120 }]}
                ListFooterComponent={() => <View style={{ height: 90 }} />}
                renderItem={({ item }) => (
                    <View style={globalStyles.item}>
                       <Text style={globalStyles.workoutName}>{item.workoutName}</Text>
                       <Text style={globalStyles.workoutDate}>Date: {new Date(item.date).toLocaleDateString('fi-FI')}</Text>
                       {item.reps !== null && <Text style={globalStyles.scoreText}>Reps: {item.reps}</Text>}
                       {item.time !== null && <Text style={globalStyles.scoreText}>Time: {item.time}</Text>}
                       {item.weight !== null && <Text style={globalStyles.scoreText}>Weight: {item.weight} {item.weightUnit}</Text>}
                       {item.notes && <Text style={globalStyles.tipText}>Notes: {item.notes}</Text>}

                       <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                            <Pressable
                                style={[globalStyles.button, globalStyles.editButton, { marginRight: 10 }]}
                                onPress={() => {
                                    setSelectedResult(item);
                                }}>
                                <Text style={globalStyles.buttonText}>Edit</Text>
                            </Pressable>

                            <Pressable
                                style={[globalStyles.button, globalStyles.deleteButton]}
                                onPress={() => handleDelete(item.id)}>
                                <Text style={globalStyles.buttonText}>Remove</Text>
                            </Pressable>
                       </View>
                    </View>
                )}
            />
            </View>
        )}

        {selectedResult && (console.log("Selected result for editing:", selectedResult),
            // Avaa ResultModal muokkaustilassa
            <EditResultModal
                visible={!!selectedResult}
                onClose={() => setSelectedResult(null)}
                result={selectedResult}
                isEdit={true}
            />
        )}


        </View>
        </KeyboardAvoidingView>
    );
}
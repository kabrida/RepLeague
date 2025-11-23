// Lähteenä: https://github.com/wix/react-native-calendars
// https://devdocs.io/date_fns/

import { ActivityIndicator, Text, View } from 'react-native';
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { globalStyles } from '../styles/globalStyles';
import { useEffect, useState } from 'react';
import { COLORS } from '../styles/theme';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import CalendarResultsModal from './CalendarResultsModal';
import EditResultModal from './EditResultModal';

export default function CalendarScreen() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [dayResults, setDayResults] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        // Haetaan tulokset Firebasesta reaaliajassa
        const unsubscribe = onSnapshot(collection(db, 'results'), async (snapshot) => {
            const fetcehedResults = await Promise.all(snapshot.docs.map(async docSnap => {
                const result = docSnap.data();

                // Haetaan treenin nimi workoutId:n perusteella
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
                    reps: result.result?.reps,
                    time: result.result?.time,
                    weight: result.result?.weight,
                    weightUnit: result.result?.weightUnit,
                    notes: result.notes,
                    workoutName
                };
            })
        );
            console.log('Fetched results:', fetcehedResults);
            setResults(fetcehedResults);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Merkitään kalenteriin päivät, joille on tallennettu tuloksia
        const marks = {};
        results.forEach(result => {
            const day = format(new Date(result.date), 'yyyy-MM-dd');
            marks[day] = { marked: true, dotColor: COLORS.accent };
        });
        setMarkedDates(marks);
    }, [results]);

    const handleDeleteResult = async (resultId) => {
        try {
            await deleteDoc(doc(db, 'results', resultId));
            console.log('Result deleted with ID:', resultId);
            setResults(prevResults => prevResults.filter(result => result.id !== resultId));
        } catch (e) {
            console.error('Error deleting result:', e);
        }
    }

    const handleEditResult = (result) => {
        // Suljetaan ensin tulosmodaali, sitten avataan muokkausmodaali valitulla tuloksella,
        // jotta vältytään modaalien päällekkäisyydeltä ja virheiltä
        setModalVisible(false);
        setTimeout(() => {
            setSelectedResult(result);
        }, 250);
    }

    const handleCloseEditModal = (updatedResult) => {
        // Sulje edit-modali
        setSelectedResult(null);

        // Jos EditResultModal palautti päivitetyn tuloksen, päivitetään paikallinen results-tila
        if (updatedResult) {
            setResults(prev => prev.map(r => r.id === updatedResult.id ? updatedResult : r));
            // Päivitä dayResults heti käyttämällä uutena tiedoista koostettua versiota
            if (selectedDate && format(new Date(updatedResult.date), 'yyyy-MM-dd') === selectedDate) {
                // Korvataan tai lisätään päivitetty tulos dayResultsiin
                setDayResults(prevDay => {
                    const exists = prevDay.some(d => d.id === updatedResult.id);
                    if (exists) {
                        return prevDay.map(d => d.id === updatedResult.id ? updatedResult : d);
                    }
                    return [...prevDay, updatedResult];
                });
            }
        }

        // Avaa takaisin päivän tulokset pienen viiveen jälkeen, jotta modaalit eivät mene päällekkäin
        setTimeout(() => {
            // Jos päivitetystä tuloksesta ei lähetetty suoraan, niin haetaan dayResults results-tilasta
            if (!updatedResult && selectedDate) {
                const refreshed = results
                    .filter(r => format(new Date(r.date), 'yyyy-MM-dd') === selectedDate)
                    .map((result, index) => ({ id: result.id || index.toString(), ...result }));
                setDayResults(refreshed);
            }
            setModalVisible(true);
        }, 250);
    }

    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#34b3e6ff" />
                <Text style={globalStyles.loadingText}>Loading workouts...</Text>
            </View>
        )
    }


    return (
        <View style={globalStyles.container}>
            <Text style={globalStyles.title}>Workout Calendar</Text>
        <Calendar
            // Kuukauden vaihtaminen automaattisesti
            markingType={'simple'}
            markedDates={markedDates}
            theme={globalStyles.calendarTheme}
            style={{ marginBottom: 20 }}
            onDayPress={(day) => {
                const dayResults = results.filter(result => format(new Date(result.date), 'yyyy-MM-dd') === day.dateString)
                .map((result, index) => ({
                    id: result.id || index.toString(),
                    ...result,
                }));
                console.log('Results for selected day:', dayResults);

                // Asetetaan valitut tulokset tilaan, jotta voidaan näyttää modaalissa
                setDayResults(dayResults);
                setSelectedDate(day.dateString);
                setModalVisible(true);
            }}
        />

        <Text style={globalStyles.instructionText}>Days with a dot indicate that you have recorded at least one workout. Tap a day to see details.</Text>


        {modalVisible && (
        <CalendarResultsModal 
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            results={dayResults}
            date={selectedDate}
            onDelete={handleDeleteResult}
            onEdit={handleEditResult}
        />
        )}

        {selectedResult && (
            <EditResultModal
                visible={!!selectedResult}
                onClose={handleCloseEditModal}
                result={selectedResult}
                isEdit={true}
            />
        )}
        </View>
    );
}
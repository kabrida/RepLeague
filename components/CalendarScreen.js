// Lähteenä: https://github.com/wix/react-native-calendars
// https://devdocs.io/date_fns/

import { ActivityIndicator, Text, View } from 'react-native';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { globalStyles } from '../styles/globalStyles';
import { useEffect, useState } from 'react';
import { COLORS } from '../styles/theme';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import CalendarResultsModal from './CalendarResultsModal';

export default function CalendarScreen() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [dayResults, setDayResults] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

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
        />
        )}
        </View>
    );
}
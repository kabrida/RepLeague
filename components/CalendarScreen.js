// Lähteenä: https://github.com/wix/react-native-calendars
// https://devdocs.io/date_fns/
// https://www.geeksforgeeks.org/reactjs/react-js-usememo-hook/

import { ActivityIndicator, Text, View } from 'react-native';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { globalStyles } from '../styles/globalStyles';
import { useEffect, useState, useMemo, useContext } from 'react';
import { COLORS } from '../styles/theme';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import CalendarResultsModal from './CalendarResultsModal';
import EditResultModal from './EditResultModal';
import { AuthContext } from '../authentication/AuthContext';

export default function CalendarScreen() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(null);
    const [dayResults, setDayResults] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);
    const { user } = useContext(AuthContext);

    // Aikamuuttujat
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(subMonths(today, 1));

    useEffect(() => {
        // Haetaan vain kirjautuneen käyttäjän tulokset kalenteriin
        if (!user) return;

        const resultsRef = collection(db, 'results');
        const q = query(resultsRef, where('userId', '==', user.uid));
        
        // Haetaan tulokset Firebasesta reaaliajassa
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetcehedResults = await Promise.all(snapshot.docs.map(async docSnap => {
                const result = docSnap.data();

                // Haetaan treenin nimi ja mode workoutId:n perusteella
                let workoutName = 'Workout';
                let workoutMode = null;
                let exercises = [];
                if(result.workoutId) {
                    try {
                        const workoutSnap = await getDoc(doc(db, 'workouts', result.workoutId));
                        if (workoutSnap.exists()) {
                            const w = workoutSnap.data();
                            workoutName = w.name ?? workoutName;
                            workoutMode = w.mode ?? null;
                            exercises = w.exercises || [];
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
                    workoutName,
                    workoutMode,
                    exercises,
                };
            })
        );
            console.log('Fetched results:', fetcehedResults);
            setResults(fetcehedResults);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Laskee kuukauden yleisimmän treenityypin (mode) nykyisestä results-tilasta
    const mostCommonModeThisMonth = useMemo(() => {
        if (!results || results.length === 0) return null;

        const freq = {};
        results.forEach(r => {
            if (!r.workoutMode) return;
            const d = new Date(r.date);
            // Käytetään date-fns:in isWithinInterval ja laskettuja month-start/end arvoja
            if (isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd })) {
                freq[r.workoutMode] = (freq[r.workoutMode] || 0) + 1;
            }
        });

        const entries = Object.entries(freq);
        if (entries.length === 0) return null;
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0][0];
    }, [results, currentMonthStart, currentMonthEnd]);

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

    // Tulokset (results) kuluvalta kuukaudelta
    const currentMonthResults = results.filter(result =>
        isWithinInterval(new Date(result.date), { start: currentMonthStart, end: currentMonthEnd })
    )

    // Tulokset (results) edelliseltä kuukaudelta
    const previousMonthResults = results.filter(result =>
        isWithinInterval(new Date(result.date), { start: previousMonthStart, end: previousMonthEnd })
    )

    // Kuinka monta kertaa on treenattu kuukaudessa
    const currentMonthWorkoutCount = currentMonthResults.length;
    const previousMonthWorkoutCount = previousMonthResults.length;
    const difference = currentMonthWorkoutCount - previousMonthWorkoutCount;

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
        
        <View style={globalStyles.calendarInfo}>
            <Text style={globalStyles.calendarInfoText}>
                You have worked out {currentMonthWorkoutCount} times this month, 
                {difference > 0
                    ? ` which is ${difference} times more than last month.`
                    : difference < 0
                        ? ` which is ${Math.abs(difference)} times less than last month.`
                        : ` which is the same as last month.`}
            </Text>
        </View>


        {mostCommonModeThisMonth ? (
            <View style={globalStyles.calendarInfo}>
            <Text style={globalStyles.calendarInfoText}>
                Most common workout type this month: {mostCommonModeThisMonth}
            </Text>
            </View>
        ) : (
            <View style={globalStyles.calendarInfo}>
            <Text style={globalStyles.calendarInfoText}>
                No workout type data for this month.
            </Text>
            </View>
        )}


        
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
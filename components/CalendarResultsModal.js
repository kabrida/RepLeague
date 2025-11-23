import { Alert, FlatList, Modal, Pressable, Text, View } from "react-native";
import { globalStyles } from "../styles/globalStyles";

export default function CalendarResultsModal({ visible, onClose, results, date, onDelete, onEdit }) {
    const handleDelete = (resultId) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to remove this result?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => {
                    onDelete(resultId); 
                    onClose();
                }}
            ]
        );
    };


    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={globalStyles.overlay}>
        <View style={[globalStyles.modalContainer, {maxHeight: '80%'}]}>
            <Text style={globalStyles.modalTitle}>Results for {new Date(date).toLocaleDateString('fi-FI')}</Text>

        {results.length === 0 ? (
            <Text style={globalStyles.notFoundText}>No results for this date.</Text>
        ) : (
            <FlatList 
                data={results}
                keyExtractor={(item, index) => item.id || index.toString()}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingBottom: 30 }}
                ListFooterComponent={() => <View style={{ height: 30 }} />}
                renderItem={({ item }) => (
                    <View style={globalStyles.item}>
                        <Text style={globalStyles.workoutName}>{item.workoutName}</Text>
                        <Text style={globalStyles.workoutDate}>Date: {new Date(item.date).toLocaleDateString('fi-FI')}</Text>
                        <Text style={globalStyles.workoutMode}>{item.workoutMode}</Text>
                        <View style={globalStyles.textContainer}>
                        {item.exercises && item.exercises.map((ex, i) => (
                            <Text key={i} style={globalStyles.exerciseText}>• {ex}</Text>
                        ))}
                        </View>
                        {item.reps !== null && <Text style={globalStyles.scoreText}>Reps: {item.reps}</Text>}
                        {item.time !== null && <Text style={globalStyles.scoreText}>Time: {item.time}</Text>}
                        {item.weight !== null && <Text style={globalStyles.scoreText}>Weight: {item.weight} {item.weightUnit}</Text>}
                        {item.notes && <Text style={globalStyles.tipText}>Notes: {item.notes}</Text>}
                        
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                            <Pressable
                                style={[globalStyles.button, globalStyles.editButton]}
                                onPress={() => onEdit(item)}
                            >
                                <Text style={globalStyles.buttonText}>Edit</Text>
                            </Pressable>
                            <Pressable
                                style={[globalStyles.button, globalStyles.deleteButton]}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Text style={globalStyles.buttonText}>Remove</Text>
                            </Pressable>
                        </View> 
                    </View>
                    )} 
                    />
        )}

            <Pressable style={[globalStyles.button, globalStyles.closeButton, {minHeight: 40, margin: 20, minWidth: '70%', alignSelf: 'center'}]} onPress={onClose}>
                <Text style={globalStyles.buttonText}>Close</Text>
            </Pressable>
        </View>
        </View>
        </Modal>
    );
}
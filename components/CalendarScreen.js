import { Text, View } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

export default function CalendarScreen() {
    return (
        <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Calendar Screen</Text>
        </View>
    );
}
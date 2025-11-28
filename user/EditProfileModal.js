import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { globalStyles } from "../styles/globalStyles";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileModal({ visible, onClose, profile }) {

    const [firstName, setFirstName] = useState(profile.firstName);
    const [lastName, setLastName] = useState(profile.lastName);
    const [email, setEmail] = useState(profile.email);
    const [birthDate, setBirthDate] = useState(profile.birthDate ? new Date(profile.birthDate) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);


    const handleSave =  async () => {
        // Tallenna profiilin päivitykset täällä
        try {
            if (!profile) {
                alert('No profile data available to update. Please reopen the editor.');
                return;
            }

            const updatedProfile = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                // Emaila ei voi muokata tässä
                birthDate: birthDate.toISOString(), // Päivitä tarvittaessa oikeaan formaattiin
            };

            await updateDoc(doc(db, 'users', profile.uid), updatedProfile);
            console.log('Profile updated successfully');
            onClose();
        } catch (error) {
            console.error('Error updating profile: ', error);
            alert('Failed to update profile. Please try again.');
        }
            
    }




    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAwareScrollView
                        style={globalStyles.addWorkoutModalContainer}
                        contentContainerStyle={{ flexGrow: 1, padding: 20, alignItems: 'center' }}
                        keyboardShouldPersistTaps="handled"
                    >

        <View style={globalStyles.overlay}>
            <View style={globalStyles.modalContainer}>
                <Text style={globalStyles.modalTitle}>Edit Profile</Text>
                <View style={{ minWidth: '100%' }}>
                <Text style={globalStyles.sectionLabel}>First Name:</Text>
                <TextInput 
                    style={globalStyles.input} 
                    value={firstName} 
                    onChangeText={setFirstName}
                    />
                <Text style={globalStyles.sectionLabel}>Last Name:</Text>
                <TextInput 
                    style={globalStyles.input} 
                    value={lastName} 
                    onChangeText={setLastName}
                />
                <Text style={globalStyles.sectionLabel}>Email:</Text>
                <TextInput 
                    style={globalStyles.input} 
                    value={email} 
                    editable={false} />
                <Text style={globalStyles.sectionLabel}>Birth Date:</Text>
                <TextInput
                    style={globalStyles.input}
                    value={birthDate.toLocaleDateString('fi-FI')}
                    editable={false}
                    />
               


                <View style={globalStyles.buttonContainer}>
                    <Pressable style={[globalStyles.button, globalStyles.cancelButton]} onPress={onClose}>
                        <Text style={globalStyles.buttonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[globalStyles.button, globalStyles.saveButton]} onPress={() => {
                        // Handle save action
                        onClose();
                    }
                    }>
                        <Text style={globalStyles.buttonText}>Save</Text>
                    </Pressable>
                </View>
            </View>
        </View>
        </View>
                    </KeyboardAwareScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}
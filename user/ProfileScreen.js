import { useContext, useState } from "react";
import { AuthContext } from "../authentication/AuthContext";
import { ActivityIndicator, Pressable, View, Text } from "react-native";
import { globalStyles } from "../styles/globalStyles";
import { COLORS } from "../styles/theme";
import EditProfileModal from "./EditProfileModal";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileScreen() {
    const { profile, loading } = useContext(AuthContext);
    const [editModalVisible, setEditModalVisible] = useState(false);

    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size='large' color={COLORS.accent} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={globalStyles.container}>
                <Text style={globalStyles.errorText}>Failed to load profile.</Text>
            </View>
        );
    }

    return (
        <View style={globalStyles.container}>
            <Ionicons name="person-circle-outline" size={100} color={COLORS.accent} style={{ marginBottom: 20, alignSelf: 'center' }} />
            <Text style={globalStyles.sectionLabel}>
                <Text style={{ fontWeight: 'bold' }}>Name: </Text>
                <Text style={{ fontWeight: '400' }}>{profile.firstName} {profile.lastName}</Text>
            </Text>
            <Text style={globalStyles.sectionLabel}>
                <Text style={{ fontWeight: 'bold' }}>Email: </Text>
                <Text style={{ fontWeight: '400' }}>{profile.email}</Text>
            </Text>
            <Text style={globalStyles.sectionLabel}>
                <Text style={{ fontWeight: 'bold' }}>Birth Date: </Text>
                <Text style={{ fontWeight: '400' }}>{new Date(profile.birthDate).toLocaleDateString('fi-FI')}</Text>
            </Text>
            <Text style={globalStyles.sectionLabel}>
                <Text style={{ fontWeight: 'bold' }}>Member since: </Text>
                <Text style={{ fontWeight: '400' }}>{new Date(profile.createdAt).toLocaleDateString('fi-FI')}</Text>
            </Text>

            <Pressable
                style={[globalStyles.button, globalStyles.editButton, { marginTop: 20 }]}
                onPress={() => setEditModalVisible(true)}
            >
                <Text style={globalStyles.buttonText}>Edit Profile</Text>
            </Pressable>

            {editModalVisible && (
                <EditProfileModal 
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    profile={profile}
                />
            )}
        </View>
    )

};
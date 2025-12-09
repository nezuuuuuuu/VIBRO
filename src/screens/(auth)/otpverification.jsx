import {
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native'
import "../../../global.css";
import React, { useState } from 'react';
import { useAuthStore } from "../../../store/authStore";


// This screen receives 'email' and potentially other data from the Signup screen
export default function OTPVerification({ route, navigation }) {
    // Get the email from the navigation parameters
    const { email, username, password } = route.params;

    const [otp, setOtp] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const { isLoading, verifyOtp, register } = useAuthStore(); // Need register to resend OTP

    // Helper to format email for display
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert("Error", "Please enter the 6-digit verification code.");
            return;
        }

        setStatusMessage('');
        
        // --- STEP 2: Call Verify OTP ---
        const result = await verifyOtp(email, otp);

        if (!result.success) {
            setStatusMessage(`Verification failed: ${result.error || "Invalid or expired OTP."}`);
            // Note: If the backend successfully creates the user, the store handles saving the token/user.
        } else {
            // SUCCESS: User is now created and logged in (token saved in store)
            Alert.alert("Success!", "Your account has been verified and created. Please Login");
            // Navigate the user to the main application flow (e.g., Home screen)
            navigation.replace('Login'); 
        }
    };
    
    const handleResendOTP = async () => {
        setStatusMessage('Resending OTP...');
        try {
            // Re-call the initial registration endpoint to generate and send a new OTP
            // The backend must handle that this is a *resend* request based on the existing pending registration
            const result = await register(username, email, password); 

            if (result.success) {
                setStatusMessage('A new OTP has been sent to your email.');
            } else {
                setStatusMessage(`Failed to resend OTP: ${result.error || "Server error."}`);
            }
        } catch (error) {
            setStatusMessage("An unexpected error occurred while resending.");
        }
    };


    return (
        <KeyboardAvoidingView
            className="flex-1 bg-primary"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View className={"flex-1 bg-primary p-6 pt-10"}>
                <Text className='p-4 text-3xl font-pbold text-white'>Verify Your Email</Text>

                <Text className='px-4 text-lg font-pregular text-gray-300 mb-8'>
                    We sent a 6-digit code to <Text className='font-pbold text-white'>{maskedEmail}</Text>.
                    Please check your inbox (and spam folder).
                </Text>
        
                {/* OTP INPUT FIELD */}
                <View className='flex flex-col mt-4 gap-y-4'>
                    <TextInput
                        className='text-white border px-4 py-5 text-xl items-center text-center tracking-widest border-[#C0C0C0] rounded-xl placeholder:text-white placeholder:font-pregular'
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={otp}
                        onChangeText={setOtp}
                        editable={!isLoading}
                    />

                    {/* Status Message */}
                    {statusMessage ? (
                        <Text className={`text-center font-pmedium mt-2 ${statusMessage.includes('failed') || statusMessage.includes('error') ? 'text-red-500' : 'text-green-400'}`}>
                            {statusMessage}
                        </Text>
                    ) : null}

                    
                    {/* Verify Button */}
                    <TouchableOpacity
                        className="px-4 py-5 mt-8 text-xl font-bold text-white rounded-lg shadow-lg bg-secondary"
                        onPress={handleVerifyOTP}
                        disabled={isLoading || otp.length !== 6}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                        <Text className="text-xl font-pbold text-center text-white">Verify Account</Text>
                        )}
                    </TouchableOpacity>

                    {/* Resend Button */}
                    <TouchableOpacity
                        className="p-4 mt-2"
                        onPress={handleResendOTP}
                        disabled={isLoading}>
                        <Text className="text-md font-pbold text-center text-lightsecondary">Resend Code</Text>
                    </TouchableOpacity>
                </View>

                {/* Back to Login */}
                <View className="flex-row items-center justify-center p-4 mt-auto">
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text className="text-lightsecondary font-pbold">Cancel and Go to Login</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({})
import {ActivityIndicator, 
        Button, 
        KeyboardAvoidingView, 
        StyleSheet, 
        Text, 
        TextInput, 
        TouchableOpacity, 
        View,
        Platform,
        Alert,
        Link,
        Image} 
from 'react-native'

import React, { useState } from 'react';
import { icons } from '../../constants';
import "../../../global.css";
import { useAuthStore } from "../../../store/authStore";
// import { useRouter, useSegments} from 'expo-router';


export default function Login({navigation}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const {isLoading, login} = useAuthStore();
  
    // const router = useRouter();
    // const segments = useSegments();

    const handleLogin = async () => {
        const result = await login(email, password);
        if(!result.success) Alert.alert("Error", result.error);
        else if (result.success) {
            navigation.replace("Tabs");
        } else {
            setError('Invalid credentials');
        }
 
    };

    return (
        <KeyboardAvoidingView
        className="flex-1 bg-primary"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
            <View className={"flex-1 bg-primary p-6 pt-10"}>
                <Text className='p-4 text-3xl font-pbold text-white'>Log In to Vibro</Text>
                 
                 {/* INPUT FIELDS */}
                 <View className='flex flex-col mt-4 gap-y-4'>
                    <TextInput
                        className='text-white border-2 px-4 py-5 text-xl border-[#C0C0C0] rounded-xl placeholder:text-white placeholder:font-pregular'
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />

                    <View class="relative w-full">
                    {/* password */}
                    <TextInput
                        className="text-white border-2 px-4 py-5 text-xl border-[#C0C0C0] rounded-xl placeholder:text-white placeholder:font-pregular"
                        placeholder="Password"
                        secureTextEntry={!showPassword} 
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={password} 
                        onChangeText={setPassword} // Correctly updates the password state
                    />
                        {/* show password */}
                        <TouchableOpacity
                            className="absolute right-4 top-1/3"
                            onPress={() => setShowPassword(!showPassword)}>
                            
                            <Image
                                source={showPassword ? icons.eyeHide : icons.eye}
                                style={{ width: 24, height: 24, tintColor: 'white' }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>


                    {/* login button */}
                <TouchableOpacity
                    className="px-4 py-5 mt-4 text-xl font-bold text-white rounded-lg shadow-lg bg-secondary"
                    onPress={() => {handleLogin()}}
                    disabled={isLoading}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />

                    ) : (
                    <Text className="text-xl font-pbold text-center text-white">Login</Text>
                    )}
                </TouchableOpacity>

                </View>
            
                <View
                    className="flex-row items-center justify-center px-4 py-4 mt-4 w-full text-2xl"
                >
                <Text className="text-white font-pregular">Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                        <Text className="text-lightsecondary font-pbold">   Sign Up</Text>
                    </TouchableOpacity>
                </View>


            </View>
       </KeyboardAvoidingView>
    );
}
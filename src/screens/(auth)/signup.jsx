import {StyleSheet, 
        Text, 
        TextInput, 
        TouchableOpacity, 
        View,
        KeyboardAvoidingView,
        Platform,
        Alert,
        ActivityIndicator,
        Image} 
from 'react-native'
import "../../../global.css";
import React, { useState } from 'react';
import { icons } from '../../constants';
import { useAuthStore } from "../../../store/authStore";


export default function Signup({navigation}) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { user, isLoading, register, token } = useAuthStore();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;



    // const router = useRouter();

    const handleSignup = async () => {


        // Check for empty fields first
        if (!username || !email || !password) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return; 
        }


         // Check email format using the regex
        if (!emailRegex.test(email)) {
            Alert.alert("Validation Error", "Please enter a valid email address format (e.g., user@example.com).");
            return; 
        }

        const result = await register(username, email, password);

        if (!result.success) {
          Alert.alert("Error", result.error);
        } else {
          Alert.alert("Success", "Account created! Please log in.");
          navigation.replace('Login');
        }

       
        
    };

    // console.log(user);
    // console.log(token);

    
    return (
        <KeyboardAvoidingView
                    className="flex-1 bg-primary"
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View className={"flex-1 bg-primary p-6 pt-10"}>
                <Text className='p-4 text-3xl font-pbold text-white'>Create an Account</Text>
        
                {/* INPUT FIELDS */}
                <View className='flex flex-col mt-4 gap-y-4'>
                    {/* email */}

                    <TextInput
                        className='text-white border px-4 py-5 text-xl border-[#C0C0C0] rounded-xl placeholder:text-white placeholder:font-pregular'
                        placeholder="Username"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={username}
                        onChangeText={setUsername}
                    />

                    <TextInput
                        className='text-white border px-4 py-5 text-xl border-[#C0C0C0] rounded-xl placeholder:text-white placeholder:font-pregular'
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />

                    
                
                {/* password input */}
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
                        onPress={() => setShowPassword(!showPassword)}
                        
                        >
                
                        <Image
                            source={showPassword ? icons.eyeHide : icons.eye}
                            style={{ width: 24, height: 24, tintColor: 'white' }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>



                    {/* sign up button */}
                    <TouchableOpacity
                        className="px-4 py-5 mt-4 text-xl font-bold text-white rounded-lg shadow-lg bg-secondary"
                        onPress={() => {handleSignup()}}
                        disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
    
                        ) : (
                        <Text className="text-xl font-pbold text-center text-white">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    
                     
                
                </View>

                <View
                    className="flex-row items-center justify-center px-4 py-4 mt-4 text-xl font-pregular"
                >
                <Text className="text-white font-pregular">Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text className="text-lightsecondary font-pbold">   Log in</Text>
                    </TouchableOpacity>
            </View>
            </View>
    </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({})
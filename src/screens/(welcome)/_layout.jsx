import { View, Text, StatusBar} from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function WelcomeLayout() {
  return (
    <Stack screenOptions={ {headerShown: false}}/>
    
  )
}
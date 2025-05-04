import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function AuthLayout() {
  return (
    <Stack screenOptions={ {headerShown: false}}/>
  )
}
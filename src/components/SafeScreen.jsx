import { View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


export default function SafeScreen({children}) {
    const insets = useSafeAreaInsets()
    return (
        <View className="flex-1 bg-primary" 
        // style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            { children}
        </View>
    );
}
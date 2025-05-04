import { Text, TouchableOpacity, View } from "react-native";
// import { StatusBar } from 'expo-status-bar';
// import {Link} from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context";
// import { useAuthStore } from "../../store/authStore"
import { useEffect } from "react";
import "../../../global.css";


export default function Index({navigation}) {
    // const { user, token, checkAuth, logout} = useAuthStore();
    // const router = useRouter();
    // console.log(user, token);

    // useEffect(() => {
    //     if (user && token) {
    //         router.replace('(tabs)');
    //     }
    //     checkAuth();
    // }, []);

    // console.log(user, token);

    return (
        <SafeAreaView className="h-full w-full flex flex-col justify-between bg-primary">
            <View className="w-full my-auto justify-center items-center">
                <Text className="w-full font-pbold text-light-400 text-8xl pt-4 justify-center ms-center text-center">VIBRO</Text>
                <Text className="font-psemibold text-light-400 text-xl w-full text-center">
                	Feel the Sound.
				</Text>
            </View>

			<View className="w-full flex flex-col p-10 justify-center items-center gap-y-2 ">
                {/* <Link href="/(auth)/signup" asChild> */}
                    <TouchableOpacity className="bg-secondary w-full rounded-xl p-6" onPress={() => navigation.navigate("Signup")}>
                        <Text className="text-white text-center font-psemibold text-xl w-full">
                            Join for free
                        </Text>
                    </TouchableOpacity>
                {/* </Link> */}

                {/* <Link href="/(auth)" asChild> */}
                    <TouchableOpacity className="p-6" onPress={() => navigation.navigate("Login")}> 
                        <Text className="text-secondary font-psemibold text-xl w-full"> 
                            Log In
                        </Text>
                    </TouchableOpacity>
                {/* </Link> */}
            </View>
          
            {/* <StatusBar style="auto"/> */}
        </SafeAreaView>

    );
}

import { View, Text, Pressable } from "react-native";
import { Colors } from "../constants/Colors"

export default function HomeScreen() {
  return (
    <View
      className={`flex-1 justify-center items-center`}
      style={{ backgroundColor: Colors.background }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Home Screen</Text>
      {/* <View className="h-[200px]  w-[80%] rounded-lg bg-white" >hello world</View> */}
      <Pressable className="h-16 w-full px-16 "style={{ backgroundColor: Colors.success}} >
      <Text>clike me</Text>
      </Pressable>
    </View>
  );
}

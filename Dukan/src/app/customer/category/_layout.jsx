
import { Stack } from "expo-router";
export default function CategoryLayout() {
    return <Stack initialRouteName="category" screenOptions={{
        headerShown: false,
        animation: "fade",
        
    }} />;
}

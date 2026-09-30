import { Redirect } from "expo-router";

// ClerkProvider completes the browser auth session; the root guard resolves roles.
export default function SSOCallback() { return <Redirect href="/" />; }

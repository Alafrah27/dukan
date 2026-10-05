import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CateoryProduct from "../../../components/category/CateoryProduct";

export default function CustomerCategory() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <CateoryProduct />
    </SafeAreaView>
  );
}
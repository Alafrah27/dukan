import React, { useState, useCallback } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "../../components/home/navbar";
import OfferSlider from "../../components/home/offer";
import Cotegry from "../../components/home/Cotegry";
import Products from "../../components/home/products";
import Colors from "../../constants/Colors";
import { OFFERS_QUERY_KEY } from "../../store/offerQuery";
import { CATEGORIES_QUERY_KEY } from "../../store/categoryQuery";
import { PRODUCTS_QUERY_KEY } from "../../store/productQuery";

export default function CustomerHome() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [OFFERS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] }),
      ]);
    } catch (error) {
      console.warn("Home screen refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Navbar />
      <Products
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <OfferSlider />
            <Cotegry />
          </>
        }
      />
    </SafeAreaView>
  );
}

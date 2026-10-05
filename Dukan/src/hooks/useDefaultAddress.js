import { useMemo } from "react";
import { useGetAddresses } from "../store/addressQuery";

/**
 * Returns the user's default delivery address (or the first saved one).
 */
export default function useDefaultAddress() {
  const { data, isLoading } = useGetAddresses();

  const address = useMemo(() => {
    const list = data?.addresses || [];
    return list.find((item) => item.isDefault) || list[0] || null;
  }, [data]);

  return {
    address,
    city: address?.destination?.city || "",
    street: address?.destination?.street1 || "",
    isLoading,
  };
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./BasketContext.css";

const BasketContext = createContext(null);
const STORAGE_KEY = "rasa-hair-studio-basket";

function loadSavedBasket() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        item.id !== undefined &&
        item.id !== null &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0,
    );
  } catch {
    return [];
  }
}

export function BasketProvider({ children }) {
  const [items, setItems] = useState(loadSavedBasket);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Could not save basket:", error);
    }
  }, [items]);

  const addItem = useCallback((product) => {
    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => String(item.id) === String(product.id),
      );

      if (existing) {
        return currentItems.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, ...product, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    const nextQuantity = Math.floor(Number(quantity) || 0);

    setItems((currentItems) => {
      if (nextQuantity <= 0) {
        return currentItems.filter(
          (item) => String(item.id) !== String(productId),
        );
      }

      return currentItems.map((item) =>
        String(item.id) === String(productId)
          ? { ...item, quantity: nextQuantity }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((currentItems) =>
      currentItems.filter((item) => String(item.id) !== String(productId)),
    );
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(() => {
    const itemCount = items.reduce(
      (total, item) => total + Number(item.quantity),
      0,
    );

    const subtotal = items.reduce(
      (total, item) => total + Number(item.price_gbp) * Number(item.quantity),
      0,
    );

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearBasket,
    };
  }, [items, addItem, updateQuantity, removeItem, clearBasket]);

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);

  if (context === null) {
    throw new Error("useBasket must be used inside BasketProvider.");
  }

  return context;
}

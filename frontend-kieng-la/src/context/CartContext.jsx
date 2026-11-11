import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children, onRequireAuth }) {
  const { user } = useAuth();

  // Mỗi người dùng có một giỏ hàng riêng biệt theo CDM: NGUOI_DUNG 1 ---- 1 GIO_HANG
  const getCartStorageKey = (userId) => {
    return userId ? `florabotanic_cart_user_${userId}` : 'florabotanic_cart_guest';
  };

  const [items, setItems] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  // Tải giỏ hàng khi người dùng thay đổi (Đăng nhập / Đăng xuất)
  useEffect(() => {
    if (user && user.id) {
      const saved = localStorage.getItem(getCartStorageKey(user.id));
      setItems(saved ? JSON.parse(saved) : []);
    } else {
      // Khi chưa đăng nhập (hoặc vừa đăng xuất) -> Giỏ hàng trống
      setItems([]);
    }
  }, [user]);

  // Lưu giỏ hàng khi items thay đổi
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem(getCartStorageKey(user.id), JSON.stringify(items));
    }
  }, [items, user]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Ràng buộc 1: Chưa đăng nhập không được thêm vào giỏ hàng
  // Ràng buộc 2: Không được vượt quá số lượng tồn kho (SoLuongTonKho)
  const addToCart = (product, quantity = 1) => {
    if (!user) {
      showToast('⚠️ Vui lòng đăng nhập tài khoản để thêm vào giỏ hàng!');
      if (onRequireAuth) {
        onRequireAuth();
      }
      return { success: false, reason: 'require_auth' };
    }

    if (product.stock <= 0) {
      showToast('❌ Sản phẩm này hiện tại đã hết hàng!');
      return { success: false, reason: 'out_of_stock' };
    }

    let isExceeded = false;
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (targetQty > product.stock) {
        isExceeded = true;
        return prevItems;
      }

      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: targetQty }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });

    if (isExceeded) {
      showToast(`⚠️ Không thể thêm! Số lượng vượt quá tồn kho hiện có (${product.stock} chậu)!`);
      return { success: false, reason: 'exceed_stock' };
    }

    showToast(`🌿 Đã thêm "${product.name}" vào giỏ hàng của bạn!`);
    return { success: true };
  };

  const updateQuantity = (productId, delta) => {
    setItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              showToast(`⚠️ Tồn kho của vườn chỉ còn ${item.product.stock} chậu!`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    showToast('🗑️ Đã xóa chậu cây khỏi giỏ hàng!');
  };

  const clearCart = () => {
    setItems([]);
    if (user && user.id) {
      localStorage.removeItem(getCartStorageKey(user.id));
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        toastMsg,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

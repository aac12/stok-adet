import React, { useState, useEffect } from "react";

export default function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saleQuantities, setSaleQuantities] = useState({});
  const [salesHistory, setSalesHistory] = useState([]);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [editingSale, setEditingSale] = useState(null);

  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    const savedSales = localStorage.getItem("salesHistory");
    if (savedSales) setSalesHistory(JSON.parse(savedSales));
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("salesHistory", JSON.stringify(salesHistory));
  }, [products, salesHistory]);

  const handleImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addOrUpdateProduct = () => {
    if (!name) return;

    if (editingId) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name,
                quantity: Number(quantity),
                price: Number(price) || 0,
                image: image || p.image,
              }
            : p
        )
      );
      setEditingId(null);
    } else {
      const newProduct = {
        id: Date.now(),
        name,
        quantity: Number(quantity),
        price: Number(price) || 0,
        image,
      };
      setProducts([...products, newProduct]);
    }

    setName("");
    setQuantity(1);
    setPrice("");
    setImage(null);
  };

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
    const updatedSales = { ...saleQuantities };
    delete updatedSales[id];
    setSaleQuantities(updatedSales);
  };

  const editProduct = (p) => {
    setName(p.name);
    setQuantity(p.quantity);
    setPrice(p.price);
    setEditingId(p.id);
    setImage(p.image);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaleQuantityChange = (id, value) => {
    setSaleQuantities({ ...saleQuantities, [id]: Number(value) });
  };

  const confirmSale = () => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    let orderTotal = 0;

    const newProducts = products.map((p) => {
      const saleQty = saleQuantities[p.id] || 0;
      const actualSale = Math.min(p.quantity, saleQty);
      if (actualSale > 0) {
        setSalesHistory((prev) => [
          ...prev,
          {
            name: p.name,
            quantity: actualSale,
            price: p.price,
            week: weekNumber,
          },
        ]);
        orderTotal += actualSale * p.price;
      }
      const newQty = Math.max(0, p.quantity - actualSale);
      return { ...p, quantity: newQty };
    });

    setProducts(newProducts);
    setSaleQuantities({});
    setLastOrderTotal(orderTotal);
  };

  const totalQuantity = filteredProducts.reduce(
    (sum, p) => sum + p.quantity,
    0
  );
  const totalPrice = filteredProducts.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0
  );

  const weeklyReport = salesHistory.reduce((acc, sale, idx) => {
    const key = `${sale.name}-W${sale.week}`;
    if (!acc[key]) acc[key] = { ...sale, id: idx };
    else acc[key].quantity += sale.quantity;
    return acc;
  }, {});

  const handleEditSale = (sale) => {
    setEditingSale(sale);
  };

  const saveEditedSale = () => {
    if (!editingSale) return;
    if (editingSale.quantity <= 0) {
      // Silmek için quantity sıfırsa
      setSalesHistory(salesHistory.filter((s, idx) => idx !== editingSale.id));
    } else {
      const updatedHistory = salesHistory.map((s, idx) =>
        idx === editingSale.id ? editingSale : s
      );
      setSalesHistory(updatedHistory);
    }
    setEditingSale(null);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <h2 style={{ textAlign: "center" }}>🛒 Ürün Listesi</h2>

      <div
        style={{
          background: "#f5f5f5",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Ürün adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Stok Adedi"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Fiyat"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={inputStyle}
        />
        <input
          type="file"
          onChange={(e) => handleImage(e.target.files[0])}
          style={{ marginBottom: 10 }}
        />
        <button onClick={addOrUpdateProduct} style={mainButton}>
          {editingId ? "Güncelle" : "Ekle"}
        </button>
      </div>

      <input
        placeholder="🔍 Ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      {filteredProducts.map((p) => (
        <div key={p.id} style={cardStyle}>
          {p.image && (
            <img src={p.image} alt="" style={{ width: 60, borderRadius: 8 }} />
          )}
          <div style={{ flex: 1 }}>
            <strong>{p.name}</strong>
            <div>Stok: {p.quantity}</div>
            <div>Fiyat: {p.price} ₺</div>
            <input
              type="number"
              placeholder="Satılacak adet"
              value={saleQuantities[p.id] || ""}
              onChange={(e) => handleSaleQuantityChange(p.id, e.target.value)}
              style={{ width: 80, marginTop: 5 }}
            />
          </div>
          <div>
            <button onClick={() => editProduct(p)} style={editButton}>
              Düzenle
            </button>
            <button onClick={() => deleteProduct(p.id)} style={deleteButton}>
              Sil
            </button>
          </div>
        </div>
      ))}

      {filteredProducts.length > 0 && (
        <button onClick={confirmSale} style={{ ...mainButton, marginTop: 15 }}>
          Satışı Onayla
        </button>
      )}

      {lastOrderTotal > 0 && (
        <div
          style={{
            marginTop: 15,
            padding: 10,
            background: "#e0f7fa",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <b>Son Sipariş Toplamı: {lastOrderTotal} ₺</b>
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>Toplam Stok Adedi: {totalQuantity}</div>
        <div>Genel Toplam: {totalPrice} ₺</div>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 10,
          background: "#fafafa",
          borderRadius: 10,
          border: "1px solid #ddd",
          maxHeight: 250,
          overflowY: "auto",
        }}
      >
        <h4 style={{ fontSize: 14 }}>📊 Haftalık Satış Raporu</h4>
        {Object.values(weeklyReport).length === 0 && (
          <div style={{ fontSize: 12 }}>Henüz satış yapılmadı.</div>
        )}
        {Object.values(weeklyReport).map((sale) => (
          <div
            key={sale.id}
            style={{
              borderBottom: "1px solid #eee",
              padding: "3px 0",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Ürün: {sale.name} | Adet: {sale.quantity} | Fiyat: {sale.price} ₺
              | Hafta: {sale.week}
            </span>
            <button
              onClick={() => handleEditSale(sale)}
              style={{ ...editButton, padding: "2px 6px", fontSize: 10 }}
            >
              Düzenle
            </button>
          </div>
        ))}
        {editingSale && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "#fff9c4",
              borderRadius: 6,
            }}
          >
            <h5 style={{ margin: 0, fontSize: 12 }}>
              Satışı Düzenle: {editingSale.name}
            </h5>
            <input
              type="number"
              value={editingSale.quantity}
              onChange={(e) =>
                setEditingSale({
                  ...editingSale,
                  quantity: Number(e.target.value),
                })
              }
              style={{ width: 80, marginRight: 10 }}
            />
            <input
              type="number"
              value={editingSale.price}
              onChange={(e) =>
                setEditingSale({
                  ...editingSale,
                  price: Number(e.target.value),
                })
              }
              style={{ width: 80, marginRight: 10 }}
            />
            <button
              onClick={saveEditedSale}
              style={{ ...mainButton, padding: "5px 10px", width: "auto" }}
            >
              Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getWeekNumber(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - dayNum);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

const inputStyle = {
  width: "100%",
  padding: 8,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const mainButton = {
  width: "100%",
  padding: 10,
  background: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const cardStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  border: "1px solid #ddd",
  padding: 10,
  borderRadius: 10,
  marginTop: 10,
  background: "#fff",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const editButton = {
  marginRight: 5,
  padding: "5px 10px",
  background: "#2196F3",
  color: "white",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
};

const deleteButton = {
  padding: "5px 10px",
  background: "#f44336",
  color: "white",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
};

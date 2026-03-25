import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [exchangeRate, setExchangeRate] = useState(6.20) // Cotação Euro/Libra para Real
  const [currencySymbol, setCurrencySymbol] = useState('€')
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // 1. ESCUTA O FIREBASE (Filtrado por Data)
  useEffect(() => {
    const q = query(collection(db, 'compras'), where("date", "==", selectedDate));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(lista.sort((a, b) => Number(a.bought) - Number(b.bought)));
    });
    return () => unsubscribe();
  }, [selectedDate])

  // 2. LÓGICA DO SCANNER (Adição Direta)
  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      scanner.render(async (decodedText) => {
        setIsScannerOpen(false);
        scanner.clear();

        const nomeItem = prompt(`Produto Novo (Ref: ${decodedText}). Qual o nome?`);
        if (nomeItem) {
          const precoItem = prompt(`Qual o preço de "${nomeItem}"?`, "0");
          await addDoc(collection(db, 'compras'), { 
            name: nomeItem, 
            quantity: 1, 
            price: Number(precoItem.replace(',', '.')), 
            bought: true, // Já entra como "No Carrinho"
            date: selectedDate,
            category: getCategory(nomeItem)
          });
        }
      }, () => {});
      return () => scanner.clear();
    }
  }, [isScannerOpen, selectedDate]);

  // 3. CATEGORIZAÇÃO AUTOMÁTICA
  const getCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('maçã') || n.includes('banana') || n.includes('fruta') || n.includes('alface')) return 'hortifruti';
    if (n.includes('pão') || n.includes('bolo') || n.includes('croissant')) return 'padaria';
    if (n.includes('leite') || n.includes('queijo') || n.includes('iogurte')) return 'laticinios';
    if (n.includes('passagem') || n.includes('trem') || n.includes('hotel') || n.includes('seguro')) return 'viagem';
    return 'geral';
  }

  // 4. CÁLCULOS
  const totalNoCarrinho = items
    .filter(item => item.bought)
    .reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const totalEstimado = items
    .reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'compras'), { 
      name: inputText, quantity: 1, price: 0, bought: false,
      date: selectedDate, category: getCategory(inputText)
    });
    setInputText('');
  }

  const updateField = async (id, field, value) => {
    await updateDoc(doc(db, 'compras', id), { [field]: Number(value) });
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="top-bar">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <div className="currency-config">
            <select value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)}>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="R$">R$ (BRL)</option>
            </select>
            <input type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} title="Cotação para Real" />
          </div>
        </div>

        <div className="summary-cards">
          <div className="card-total estimated">
            <span>Estimado</span>
            <strong>{currencySymbol} {totalEstimado.toFixed(2)}</strong>
          </div>
          <div className="card-total in-cart">
            <span>No Carrinho</span>
            <strong>{currencySymbol} {totalNoCarrinho.toFixed(2)}</strong>
            <small>≈ R$ {(totalNoCarrinho * exchangeRate).toFixed(2)}</small>
          </div>
        </div>
      </header>

      {isScannerOpen && <div id="reader"></div>}

      <form className="input-form" onSubmit={handleAddManual}>
        <div className="row">
          <input type="text" placeholder="Adicionar item..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <button type="button" className="scan-btn" onClick={() => setIsScannerOpen(!isScannerOpen)}>📷</button>
          <button type="submit" className="add-button">+</button>
        </div>
      </form>

      <div className="list-container">
        {items.map(item => (
          <div key={item.id} className={`item-card ${item.bought ? 'bought' : ''} cat-${item.category}`}>
            <div className={`check-circle ${item.bought ? 'checked' : ''}`} 
                 onClick={() => updateDoc(doc(db, 'compras', item.id), { bought: !item.bought })}>
              {item.bought && '✓'}
            </div>
            
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <div className="item-controls">
                <input type="number" className="mini-input" defaultValue={item.quantity} onBlur={(e) => updateField(item.id, 'quantity', e.target.value)} />
                <span>x</span>
                <input type="number" step="0.01" className="mini-input price" defaultValue={item.price} onBlur={(e) => updateField(item.id, 'price', e.target.value)} />
              </div>
            </div>
            <button className="delete-btn" onClick={() => deleteDoc(doc(db, 'compras', item.id))}>×</button>
          </div>
        ))}
        {items.length === 0 && <p className="empty-msg">Lista vazia para este dia.</p>}
      </div>
    </div>
  )
}

export default App
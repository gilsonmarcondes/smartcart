import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState([])
  const [exchangeRate, setExchangeRate] = useState(6.20) // Cotação padrão (ex: Euro/Libra)
  const [currencySymbol, setCurrencySymbol] = useState('€')

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'compras'), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(lista.sort((a, b) => Number(a.bought) - Number(b.bought)));
    });
    return () => unsubscribe();
  }, [])

  // CATEGORIZAÇÃO AUTOMÁTICA
  const getCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('maçã') || n.includes('banana') || n.includes('fruta')) return 'hortifruti';
    if (n.includes('pão') || n.includes('bolo')) return 'padaria';
    if (n.includes('leite') || n.includes('queijo')) return 'laticinios';
    if (n.includes('passagem') || n.includes('seguro') || n.includes('hotel')) return 'viagem';
    return 'geral';
  }

  const totalNoCarrinho = items
    .filter(item => item.bought)
    .reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'compras'), { 
      name: inputText, 
      quantity: 1, price: 0, bought: false,
      category: getCategory(inputText)
    });
    setInputText('');
  }

  const updateField = async (id, field, value) => {
    await updateDoc(doc(db, 'compras', id), { [field]: Number(value) });
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="config-row">
          <select value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)}>
            <option value="€">Euro (€)</option>
            <option value="£">Libra (£)</option>
            <option value="R$">Real (R$)</option>
          </select>
          <input 
            type="number" 
            placeholder="Cotação" 
            value={exchangeRate} 
            onChange={(e) => setExchangeRate(e.target.value)} 
          />
        </div>
        
        <div className="summary">
          <div className="total-box carrinho">
            <span>No Carrinho ({currencySymbol})</span>
            <strong>{currencySymbol} {totalNoCarrinho.toFixed(2)}</strong>
            <small>≈ R$ {(totalNoCarrinho * exchangeRate).toFixed(2)}</small>
          </div>
        </div>
      </header>

      <form className="input-form" onSubmit={handleAdd}>
        <div className="row">
          <input type="text" placeholder="O que comprar?" value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <button type="submit" className="add-button">+</button>
        </div>
      </form>

      <div className="list-container">
        {items.map(item => (
          <div key={item.id} className={`item-card ${item.bought ? 'bought' : ''} cat-${item.category}`}>
            <div className={`check-circle ${item.bought ? 'checked' : ''}`} onClick={() => updateDoc(doc(db, 'compras', item.id), { bought: !item.bought })}>
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
      </div>
    </div>
  )
}

export default App
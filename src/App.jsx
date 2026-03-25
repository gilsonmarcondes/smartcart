import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from './firebase'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Padrão: Hoje (2026-03-25)

  // ESCUTA O FIREBASE FILTRANDO PELA DATA SELECIONADA
  useEffect(() => {
    const q = query(collection(db, 'compras'), where("date", "==", selectedDate));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(lista.sort((a, b) => Number(a.bought) - Number(b.bought)));
    });
    return () => unsubscribe();
  }, [selectedDate])

  const totalNoCarrinho = items
    .filter(item => item.bought)
    .reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'compras'), { 
      name: inputText, 
      quantity: 1, price: 0, bought: false,
      date: selectedDate // Salva o item atrelado à data escolhida
    });
    setInputText('');
  }

  const updateField = async (id, field, value) => {
    await updateDoc(doc(db, 'compras', id), { [field]: Number(value) });
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="date-selector">
          <label>Data da Lista:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
        
        <div className="summary">
          <div className="total-box carrinho">
            <span>No Carrinho ({selectedDate === '2026-03-25' ? 'Hoje' : selectedDate})</span>
            <strong>R$ {totalNoCarrinho.toFixed(2)}</strong>
          </div>
        </div>
      </header>

      <form className="input-form" onSubmit={handleAdd}>
        <div className="row">
          <input type="text" placeholder="O que comprar nesta data?" value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <button type="submit" className="add-button">+</button>
        </div>
      </form>

      <div className="list-container">
        {items.length === 0 && <p className="empty-msg">Nenhum item para este dia.</p>}
        {items.map(item => (
          <div key={item.id} className={`item-card ${item.bought ? 'bought' : ''}`}>
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
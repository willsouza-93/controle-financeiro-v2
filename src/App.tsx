import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Box,
  CircleDollarSign,
  ClipboardList,
  Download,
  HandCoins,
  HandHeart,
  LayoutDashboard,
  Plus,
  Receipt,
  Save,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { storage } from './services/storage';
import { Order, OrderStatus, Settings, Transaction, TransactionType } from './types/finance';
import {
  cashBalance,
  expensesByCategory,
  expensesByMonth,
  grossProfit,
  monthlyRevenue,
  pendingLoansBalance,
  revenueByMonth,
  totalContributions,
  totalLoansPaid,
  totalLoansReceived,
  totalOperationalExpenses,
  totalRevenue,
  totalWithdrawals,
} from './utils/finance';

const tabs = ['Dashboard', 'Transações', 'Encomendas', 'Gráficos', 'Configurações', 'Declaração', 'Backup'] as const;
const txTypes: TransactionType[] = ['Receita', 'Despesa', 'Empréstimo recebido', 'Pagamento de empréstimo', 'Aporte', 'Retirada', 'Transferência'];
const orderStatuses: OrderStatus[] = ['Pendente', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const now = () => new Date().toISOString();

const emptyTx = { type: 'Receita' as TransactionType, amount: 0, date: format(new Date(), 'yyyy-MM-dd'), category: '', description: '', person: '', notes: '' };
const emptyOrder = { clientName: '', description: '', deliveryDate: format(new Date(), 'yyyy-MM-dd'), deliveryTime: '18:00', value: 0, status: 'Pendente' as OrderStatus, notes: '' };

export function App() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  const [orders, setOrders] = useState<Order[]>(storage.getOrders());
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [txModal, setTxModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [txForm, setTxForm] = useState(emptyTx);
  const [orderForm, setOrderForm] = useState(emptyOrder);

  const persistTx = (v: Transaction[]) => { setTransactions(v); storage.setTransactions(v); };
  const persistOrders = (v: Order[]) => { setOrders(v); storage.setOrders(v); };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRev = monthlyRevenue(transactions, currentMonth, currentYear);
  const monthExp = expensesByMonth(transactions, currentYear)[currentMonth].expenses;

  const kpis = [
    { title: 'Saldo em Caixa', value: cashBalance(transactions), color: 'text-emerald-600', icon: Wallet },
    { title: 'Receitas do Mês', value: monthRev, color: 'text-emerald-500', icon: CircleDollarSign },
    { title: 'Despesas do Mês', value: monthExp, color: 'text-red-500', icon: Receipt },
    { title: 'Lucro Operacional', value: grossProfit(transactions), color: 'text-blue-600', icon: BarChart3 },
    { title: 'Empréstimos Pendentes', value: pendingLoansBalance(transactions), color: 'text-amber-600', icon: HandCoins },
  ];

  const saveTransaction = () => {
    if (!txForm.amount || txForm.amount <= 0 || !txForm.date || !txForm.type || !txForm.category) return alert('Preencha os campos obrigatórios.');
    if (txForm.type === 'Empréstimo recebido' && !txForm.person) return alert('Credor obrigatório para empréstimo recebido.');
    persistTx([{ id: crypto.randomUUID(), ...txForm, createdAt: now(), updatedAt: now() }, ...transactions]);
    setTxForm(emptyTx); setTxModal(false);
  };

  const saveOrder = () => {
    if (!orderForm.clientName || !orderForm.description || !orderForm.deliveryDate || !orderForm.deliveryTime || orderForm.value <= 0) return alert('Preencha os campos obrigatórios da encomenda.');
    persistOrders([{ id: crypto.randomUUID(), ...orderForm, createdAt: now(), updatedAt: now() }, ...orders]);
    setOrderForm(emptyOrder); setOrderModal(false);
  };

  const markDelivered = (o: Order) => {
    persistOrders(orders.map((x) => (x.id === o.id ? { ...x, status: 'Entregue', updatedAt: now() } : x)));
    if (confirm('Deseja gerar Receita automaticamente?')) {
      if (transactions.some((t) => t.linkedOrderId === o.id)) return alert('Essa receita já existe.');
      persistTx([{ id: crypto.randomUUID(), type: 'Receita', category: 'Encomendas', amount: o.value, date: o.deliveryDate, description: `Receita gerada pela encomenda de ${o.clientName}`, linkedOrderId: o.id, createdAt: now(), updatedAt: now() }, ...transactions]);
    }
  };

  const report = () => {
    const d = new jsPDF();
    d.text(`${settings.businessName} - Relatório Anual ${settings.referenceYear}`, 10, 12);
    d.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 10, 20);
    d.text(`Receita Bruta: ${brl(totalRevenue(transactions))}`, 10, 30);
    d.text(`Despesas Operacionais: ${brl(totalOperationalExpenses(transactions))}`, 10, 38);
    d.text(`Lucro Operacional: ${brl(grossProfit(transactions))}`, 10, 46);
    d.text(`Aportes: ${brl(totalContributions(transactions))} | Retiradas: ${brl(totalWithdrawals(transactions))}`, 10, 54);
    d.text('Relatório auxiliar para organização financeira. Não substitui orientação contábil.', 10, 64);
    d.save(`relatorio-${settings.referenceYear}.pdf`);
  };

  const allocTotal = Object.values(settings.allocation).reduce((a, b) => a + b, 0);
  const monthSeries = revenueByMonth(transactions, currentYear).map((m, idx) => ({ month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][idx], receitas: m.revenue, despesas: expensesByMonth(transactions, currentYear)[idx].expenses }));
  const expCats = expensesByCategory(transactions);

  return <div className='app-shell'>
    <aside className='sidebar'>{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`nav-btn ${tab === t ? 'active' : ''}`}>{t}</button>)}</aside>
    <main className='content'>
      <header className='page-header'><h1>Controle Financeiro Local</h1><button className='primary' onClick={() => setTxModal(true)}><Plus size={16} /> Nova Transação</button></header>

      {tab === 'Dashboard' && <>
        <section className='kpi-grid'>{kpis.map((k) => <div key={k.title} className='card'><k.icon size={16} /><p>{k.title}</p><h3 className={k.color}>{brl(k.value)}</h3></div>)}</section>
        <section className='two-col'><div className='card'><h3>Transações Recentes</h3>{transactions.slice(0, 6).map((t) => <div key={t.id} className='row'><span>{t.type} • {t.category}</span><b className={t.type === 'Despesa' ? 'text-red-500' : 'text-emerald-600'}>{brl(t.amount)}</b></div>)}</div><div className='card'><h3>Alocação Planejada</h3>{Object.entries(settings.allocation).map(([k, v]) => <div key={k} className='row'><span>{k}</span><b>{v}%</b></div>)}</div></section>
      </>}

      {tab === 'Transações' && <div className='card'><h2>Transações</h2>{transactions.map((t) => <div key={t.id} className='row'><span>{t.date} • {t.description || t.category}</span><b>{brl(t.amount)}</b></div>)}</div>}
      {tab === 'Encomendas' && <div className='card'><div className='row'><h2>Encomendas</h2><button className='secondary' onClick={() => setOrderModal(true)}>Nova Encomenda</button></div>{orders.map((o) => <div key={o.id} className='row'><span>{o.clientName} - {o.status}</span><span><b>{brl(o.value)}</b> {o.status !== 'Entregue' && <button className='ghost' onClick={() => markDelivered(o)}>Marcar entregue</button>}</span></div>)}</div>}
      {tab === 'Gráficos' && <div className='grid2'>
        <div className='card chart'>{monthSeries.length ? <ResponsiveContainer><BarChart data={monthSeries}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='month' /><YAxis /><Tooltip /><Legend /><Bar dataKey='receitas' fill='#16a34a' /><Bar dataKey='despesas' fill='#ef4444' /></BarChart></ResponsiveContainer> : 'Sem dados'}</div>
        <div className='card chart'>{expCats.length ? <ResponsiveContainer><PieChart><Pie data={expCats} dataKey='value' nameKey='name'>{expCats.map((_, i) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'][i % 4]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : 'Sem dados'}</div>
        <div className='card chart'><ResponsiveContainer><LineChart data={monthSeries}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='month' /><YAxis /><Tooltip /><Line dataKey='receitas' stroke='#16a34a' /><Line dataKey='despesas' stroke='#ef4444' /></LineChart></ResponsiveContainer></div>
      </div>}
      {tab === 'Configurações' && <div className='card'><h2>Configurações</h2><input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} /><input value={settings.ownerName} onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })} />{(['capital', 'salarios', 'emergencia', 'utilidades', 'outros'] as const).map((k) => <div key={k} className='row'><label>{k}</label><input type='number' value={settings.allocation[k]} onChange={(e) => setSettings({ ...settings, allocation: { ...settings.allocation, [k]: Number(e.target.value) } })} /></div>)}<p className={allocTotal === 100 ? 'text-emerald-600' : 'text-red-500'}>Total: {allocTotal}%</p><button disabled={allocTotal !== 100} className='primary' onClick={() => storage.setSettings(settings)}>Salvar</button></div>}
      {tab === 'Declaração' && <div className='card'><h2>Declaração / Relatório</h2><div className='kpi-grid'><div className='mini'>Receita Bruta {brl(totalRevenue(transactions))}</div><div className='mini'>Despesas Operacionais {brl(totalOperationalExpenses(transactions))}</div><div className='mini'>Lucro Operacional {brl(grossProfit(transactions))}</div></div><button className='primary' onClick={report}>Gerar PDF</button></div>}
      {tab === 'Backup' && <div className='card'><h2>Backup</h2><p>Os dados ficam salvos apenas neste navegador. Exporte backups regularmente.</p><div className='row'><button className='secondary' onClick={() => { const data = storage.exportBackup(); const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'backup-financeiro.json'; a.click(); }}>Exportar JSON</button><input type='file' accept='application/json' onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; storage.importBackup(JSON.parse(await f.text())); location.reload(); }} /><button className='danger' onClick={() => confirm('Limpar tudo?') && (storage.clear(), location.reload())}>Limpar dados</button></div></div>}
    </main>

    {txModal && <div className='modal'><div className='dialog'><div className='row'><h3>Nova Transação</h3><button className='ghost' onClick={() => setTxModal(false)}><X size={16} /></button></div><select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value as TransactionType })}>{txTypes.map((t) => <option key={t}>{t}</option>)}</select><input type='number' placeholder='Valor' value={txForm.amount || ''} onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })} /><input type='date' value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} /><input placeholder='Categoria' value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} /><input placeholder='Descrição (opcional)' value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} /><input placeholder='Pessoa/Credor' value={txForm.person} onChange={(e) => setTxForm({ ...txForm, person: e.target.value })} /><textarea placeholder='Observações' value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} /><button className='primary' onClick={saveTransaction}>Salvar Transação</button></div></div>}
    {orderModal && <div className='modal'><div className='dialog'><h3>Nova Encomenda</h3><input placeholder='Cliente' value={orderForm.clientName} onChange={(e) => setOrderForm({ ...orderForm, clientName: e.target.value })} /><input placeholder='Descrição' value={orderForm.description} onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} /><input type='date' value={orderForm.deliveryDate} onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })} /><input type='time' value={orderForm.deliveryTime} onChange={(e) => setOrderForm({ ...orderForm, deliveryTime: e.target.value })} /><input type='number' placeholder='Valor' value={orderForm.value || ''} onChange={(e) => setOrderForm({ ...orderForm, value: Number(e.target.value) })} /><select value={orderForm.status} onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as OrderStatus })}>{orderStatuses.map((s) => <option key={s}>{s}</option>)}</select><textarea placeholder='Observações' value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} /><button className='primary' onClick={saveOrder}>Salvar Encomenda</button></div></div>}
  </div>;
}

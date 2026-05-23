import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { BarChart3, CircleDollarSign, HandCoins, Plus, Receipt, Wallet, X, } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { format } from 'date-fns';
import { storage } from './services/storage';
import { cashBalance, expensesByCategory, expensesByMonth, grossProfit, monthlyRevenue, pendingLoansBalance, revenueByMonth, totalContributions, totalOperationalExpenses, totalRevenue, totalWithdrawals, } from './utils/finance';
const tabs = ['Dashboard', 'Transações', 'Encomendas', 'Gráficos', 'Configurações', 'Declaração', 'Backup'];
const txTypes = ['Receita', 'Despesa', 'Empréstimo recebido', 'Pagamento de empréstimo', 'Aporte', 'Retirada', 'Transferência'];
const orderStatuses = ['Pendente', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'];
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const now = () => new Date().toISOString();
const emptyTx = { type: 'Receita', amount: 0, date: format(new Date(), 'yyyy-MM-dd'), category: '', description: '', person: '', notes: '' };
const emptyOrder = { clientName: '', description: '', deliveryDate: format(new Date(), 'yyyy-MM-dd'), deliveryTime: '18:00', value: 0, status: 'Pendente', notes: '' };
export function App() {
    const [tab, setTab] = useState('Dashboard');
    const [transactions, setTransactions] = useState(storage.getTransactions());
    const [orders, setOrders] = useState(storage.getOrders());
    const [settings, setSettings] = useState(storage.getSettings());
    const [txModal, setTxModal] = useState(false);
    const [orderModal, setOrderModal] = useState(false);
    const [txForm, setTxForm] = useState(emptyTx);
    const [orderForm, setOrderForm] = useState(emptyOrder);
    const persistTx = (v) => { setTransactions(v); storage.setTransactions(v); };
    const persistOrders = (v) => { setOrders(v); storage.setOrders(v); };
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
        if (!txForm.amount || txForm.amount <= 0 || !txForm.date || !txForm.type || !txForm.category)
            return alert('Preencha os campos obrigatórios.');
        if (txForm.type === 'Empréstimo recebido' && !txForm.person)
            return alert('Credor obrigatório para empréstimo recebido.');
        persistTx([{ id: crypto.randomUUID(), ...txForm, createdAt: now(), updatedAt: now() }, ...transactions]);
        setTxForm(emptyTx);
        setTxModal(false);
    };
    const saveOrder = () => {
        if (!orderForm.clientName || !orderForm.description || !orderForm.deliveryDate || !orderForm.deliveryTime || orderForm.value <= 0)
            return alert('Preencha os campos obrigatórios da encomenda.');
        persistOrders([{ id: crypto.randomUUID(), ...orderForm, createdAt: now(), updatedAt: now() }, ...orders]);
        setOrderForm(emptyOrder);
        setOrderModal(false);
    };
    const markDelivered = (o) => {
        persistOrders(orders.map((x) => (x.id === o.id ? { ...x, status: 'Entregue', updatedAt: now() } : x)));
        if (confirm('Deseja gerar Receita automaticamente?')) {
            if (transactions.some((t) => t.linkedOrderId === o.id))
                return alert('Essa receita já existe.');
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
    return _jsxs("div", { className: 'app-shell', children: [_jsx("aside", { className: 'sidebar', children: tabs.map((t) => _jsx("button", { onClick: () => setTab(t), className: `nav-btn ${tab === t ? 'active' : ''}`, children: t }, t)) }), _jsxs("main", { className: 'content', children: [_jsxs("header", { className: 'page-header', children: [_jsx("h1", { children: "Controle Financeiro Local" }), _jsxs("button", { className: 'primary', onClick: () => setTxModal(true), children: [_jsx(Plus, { size: 16 }), " Nova Transa\u00E7\u00E3o"] })] }), tab === 'Dashboard' && _jsxs(_Fragment, { children: [_jsx("section", { className: 'kpi-grid', children: kpis.map((k) => _jsxs("div", { className: 'card', children: [_jsx(k.icon, { size: 16 }), _jsx("p", { children: k.title }), _jsx("h3", { className: k.color, children: brl(k.value) })] }, k.title)) }), _jsxs("section", { className: 'two-col', children: [_jsxs("div", { className: 'card', children: [_jsx("h3", { children: "Transa\u00E7\u00F5es Recentes" }), transactions.slice(0, 6).map((t) => _jsxs("div", { className: 'row', children: [_jsxs("span", { children: [t.type, " \u2022 ", t.category] }), _jsx("b", { className: t.type === 'Despesa' ? 'text-red-500' : 'text-emerald-600', children: brl(t.amount) })] }, t.id))] }), _jsxs("div", { className: 'card', children: [_jsx("h3", { children: "Aloca\u00E7\u00E3o Planejada" }), Object.entries(settings.allocation).map(([k, v]) => _jsxs("div", { className: 'row', children: [_jsx("span", { children: k }), _jsxs("b", { children: [v, "%"] })] }, k))] })] })] }), tab === 'Transações' && _jsxs("div", { className: 'card', children: [_jsx("h2", { children: "Transa\u00E7\u00F5es" }), transactions.map((t) => _jsxs("div", { className: 'row', children: [_jsxs("span", { children: [t.date, " \u2022 ", t.description || t.category] }), _jsx("b", { children: brl(t.amount) })] }, t.id))] }), tab === 'Encomendas' && _jsxs("div", { className: 'card', children: [_jsxs("div", { className: 'row', children: [_jsx("h2", { children: "Encomendas" }), _jsx("button", { className: 'secondary', onClick: () => setOrderModal(true), children: "Nova Encomenda" })] }), orders.map((o) => _jsxs("div", { className: 'row', children: [_jsxs("span", { children: [o.clientName, " - ", o.status] }), _jsxs("span", { children: [_jsx("b", { children: brl(o.value) }), " ", o.status !== 'Entregue' && _jsx("button", { className: 'ghost', onClick: () => markDelivered(o), children: "Marcar entregue" })] })] }, o.id))] }), tab === 'Gráficos' && _jsxs("div", { className: 'grid2', children: [_jsx("div", { className: 'card chart', children: monthSeries.length ? _jsx(ResponsiveContainer, { children: _jsxs(BarChart, { data: monthSeries, children: [_jsx(CartesianGrid, { strokeDasharray: '3 3' }), _jsx(XAxis, { dataKey: 'month' }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: 'receitas', fill: '#16a34a' }), _jsx(Bar, { dataKey: 'despesas', fill: '#ef4444' })] }) }) : 'Sem dados' }), _jsx("div", { className: 'card chart', children: expCats.length ? _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: expCats, dataKey: 'value', nameKey: 'name', children: expCats.map((_, i) => _jsx(Cell, { fill: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'][i % 4] }, i)) }), _jsx(Tooltip, {})] }) }) : 'Sem dados' }), _jsx("div", { className: 'card chart', children: _jsx(ResponsiveContainer, { children: _jsxs(LineChart, { data: monthSeries, children: [_jsx(CartesianGrid, { strokeDasharray: '3 3' }), _jsx(XAxis, { dataKey: 'month' }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { dataKey: 'receitas', stroke: '#16a34a' }), _jsx(Line, { dataKey: 'despesas', stroke: '#ef4444' })] }) }) })] }), tab === 'Configurações' && _jsxs("div", { className: 'card', children: [_jsx("h2", { children: "Configura\u00E7\u00F5es" }), _jsx("input", { value: settings.businessName, onChange: (e) => setSettings({ ...settings, businessName: e.target.value }) }), _jsx("input", { value: settings.ownerName, onChange: (e) => setSettings({ ...settings, ownerName: e.target.value }) }), ['capital', 'salarios', 'emergencia', 'utilidades', 'outros'].map((k) => _jsxs("div", { className: 'row', children: [_jsx("label", { children: k }), _jsx("input", { type: 'number', value: settings.allocation[k], onChange: (e) => setSettings({ ...settings, allocation: { ...settings.allocation, [k]: Number(e.target.value) } }) })] }, k)), _jsxs("p", { className: allocTotal === 100 ? 'text-emerald-600' : 'text-red-500', children: ["Total: ", allocTotal, "%"] }), _jsx("button", { disabled: allocTotal !== 100, className: 'primary', onClick: () => storage.setSettings(settings), children: "Salvar" })] }), tab === 'Declaração' && _jsxs("div", { className: 'card', children: [_jsx("h2", { children: "Declara\u00E7\u00E3o / Relat\u00F3rio" }), _jsxs("div", { className: 'kpi-grid', children: [_jsxs("div", { className: 'mini', children: ["Receita Bruta ", brl(totalRevenue(transactions))] }), _jsxs("div", { className: 'mini', children: ["Despesas Operacionais ", brl(totalOperationalExpenses(transactions))] }), _jsxs("div", { className: 'mini', children: ["Lucro Operacional ", brl(grossProfit(transactions))] })] }), _jsx("button", { className: 'primary', onClick: report, children: "Gerar PDF" })] }), tab === 'Backup' && _jsxs("div", { className: 'card', children: [_jsx("h2", { children: "Backup" }), _jsx("p", { children: "Os dados ficam salvos apenas neste navegador. Exporte backups regularmente." }), _jsxs("div", { className: 'row', children: [_jsx("button", { className: 'secondary', onClick: () => { const data = storage.exportBackup(); const b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'backup-financeiro.json'; a.click(); }, children: "Exportar JSON" }), _jsx("input", { type: 'file', accept: 'application/json', onChange: async (e) => { const f = e.target.files?.[0]; if (!f)
                                            return; storage.importBackup(JSON.parse(await f.text())); location.reload(); } }), _jsx("button", { className: 'danger', onClick: () => confirm('Limpar tudo?') && (storage.clear(), location.reload()), children: "Limpar dados" })] })] })] }), txModal && _jsx("div", { className: 'modal', children: _jsxs("div", { className: 'dialog', children: [_jsxs("div", { className: 'row', children: [_jsx("h3", { children: "Nova Transa\u00E7\u00E3o" }), _jsx("button", { className: 'ghost', onClick: () => setTxModal(false), children: _jsx(X, { size: 16 }) })] }), _jsx("select", { value: txForm.type, onChange: (e) => setTxForm({ ...txForm, type: e.target.value }), children: txTypes.map((t) => _jsx("option", { children: t }, t)) }), _jsx("input", { type: 'number', placeholder: 'Valor', value: txForm.amount || '', onChange: (e) => setTxForm({ ...txForm, amount: Number(e.target.value) }) }), _jsx("input", { type: 'date', value: txForm.date, onChange: (e) => setTxForm({ ...txForm, date: e.target.value }) }), _jsx("input", { placeholder: 'Categoria', value: txForm.category, onChange: (e) => setTxForm({ ...txForm, category: e.target.value }) }), _jsx("input", { placeholder: 'Descri\u00E7\u00E3o (opcional)', value: txForm.description, onChange: (e) => setTxForm({ ...txForm, description: e.target.value }) }), _jsx("input", { placeholder: 'Pessoa/Credor', value: txForm.person, onChange: (e) => setTxForm({ ...txForm, person: e.target.value }) }), _jsx("textarea", { placeholder: 'Observa\u00E7\u00F5es', value: txForm.notes, onChange: (e) => setTxForm({ ...txForm, notes: e.target.value }) }), _jsx("button", { className: 'primary', onClick: saveTransaction, children: "Salvar Transa\u00E7\u00E3o" })] }) }), orderModal && _jsx("div", { className: 'modal', children: _jsxs("div", { className: 'dialog', children: [_jsx("h3", { children: "Nova Encomenda" }), _jsx("input", { placeholder: 'Cliente', value: orderForm.clientName, onChange: (e) => setOrderForm({ ...orderForm, clientName: e.target.value }) }), _jsx("input", { placeholder: 'Descri\u00E7\u00E3o', value: orderForm.description, onChange: (e) => setOrderForm({ ...orderForm, description: e.target.value }) }), _jsx("input", { type: 'date', value: orderForm.deliveryDate, onChange: (e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value }) }), _jsx("input", { type: 'time', value: orderForm.deliveryTime, onChange: (e) => setOrderForm({ ...orderForm, deliveryTime: e.target.value }) }), _jsx("input", { type: 'number', placeholder: 'Valor', value: orderForm.value || '', onChange: (e) => setOrderForm({ ...orderForm, value: Number(e.target.value) }) }), _jsx("select", { value: orderForm.status, onChange: (e) => setOrderForm({ ...orderForm, status: e.target.value }), children: orderStatuses.map((s) => _jsx("option", { children: s }, s)) }), _jsx("textarea", { placeholder: 'Observa\u00E7\u00F5es', value: orderForm.notes, onChange: (e) => setOrderForm({ ...orderForm, notes: e.target.value }) }), _jsx("button", { className: 'primary', onClick: saveOrder, children: "Salvar Encomenda" })] }) })] });
}

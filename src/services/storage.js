const KEYS = { transactions: 'cfl_transactions', orders: 'cfl_orders', settings: 'cfl_settings', lastBackup: 'cfl_last_backup' };
const defaultSettings = { businessName: 'Controle Financeiro Local', ownerName: '', referenceYear: new Date().getFullYear(), currency: 'BRL', allocation: { capital: 40, salarios: 30, emergencia: 10, utilidades: 10, outros: 10 } };
const get = (k, d) => { try {
    return JSON.parse(localStorage.getItem(k) || '');
}
catch {
    return d;
} };
export const storage = { getTransactions: () => get(KEYS.transactions, []), setTransactions: (v) => localStorage.setItem(KEYS.transactions, JSON.stringify(v)), getOrders: () => get(KEYS.orders, []), setOrders: (v) => localStorage.setItem(KEYS.orders, JSON.stringify(v)), getSettings: () => get(KEYS.settings, defaultSettings), setSettings: (v) => localStorage.setItem(KEYS.settings, JSON.stringify(v)), exportBackup: () => ({ transactions: storage.getTransactions(), orders: storage.getOrders(), settings: storage.getSettings(), lastBackupAt: new Date().toISOString() }), importBackup: (d) => { storage.setTransactions(d.transactions || []); storage.setOrders(d.orders || []); storage.setSettings(d.settings || defaultSettings); localStorage.setItem(KEYS.lastBackup, new Date().toISOString()); }, clear: () => Object.values(KEYS).forEach((k) => localStorage.removeItem(k)), getLastBackupAt: () => localStorage.getItem(KEYS.lastBackup) };

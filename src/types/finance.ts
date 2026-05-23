export type TransactionType = 'Receita'|'Despesa'|'Aporte'|'Retirada'|'Empréstimo recebido'|'Pagamento de empréstimo'|'Transferência';
export type TransactionCategory = string;
export type LoanStatus = 'pendente'|'pago';
export type OrderStatus = 'Pendente'|'Em Produção'|'Pronto'|'Entregue'|'Cancelado';
export interface Transaction {id:string;type:TransactionType;amount:number;date:string;category:string;description?:string;createdAt:string;updatedAt:string;person?:string;paymentMethod?:string;notes?:string;linkedOrderId?:string;loanId?:string;}
export interface Loan {id:string;creditor:string;amount:number;status:LoanStatus;createdAt:string;updatedAt:string;}
export interface Order {id:string;clientName:string;description:string;deliveryDate:string;deliveryTime:string;value:number;status:OrderStatus;notes?:string;createdAt:string;updatedAt:string;}
export interface Settings {businessName:string;ownerName:string;referenceYear:number;currency:'BRL';allocation:{capital:number;salarios:number;emergencia:number;utilidades:number;outros:number;}}
export interface BackupData {transactions:Transaction[];orders:Order[];settings:Settings;lastBackupAt?:string;}

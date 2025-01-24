// LedgerGroupList.ts
type LedgerGroup = {
    label: string;
    value: string;
  };
  
  const ledgerGroupsList: LedgerGroup[] = [
    { label: 'Account Payable', value: 'Account Payable' },
    { label: 'Account Receivable', value: 'Account Receivable' },
    { label: 'Bank Accounts', value: 'Bank Accounts' },
    { label: 'Capital Account', value: 'Capital Account' },
    { label: 'Cash in Hand', value: 'Cash in Hand' },
    { label: 'Current Assets', value: 'Current Assets' },
    { label: 'Current Liabilities', value: 'Current Liabilities' },
    { label: 'Deposit', value: 'Deposit' },
    { label: 'Direct Expenses', value: 'Direct Expenses' },
    { label: 'Direct Income', value: 'Direct Income' },
    { label: 'Fixed Assets', value: 'Fixed Assets' },
    { label: 'Indirect Expenses', value: 'Indirect Expenses' },
    { label: 'Indirect Income', value: 'Indirect Income' },
    { label: 'Investment', value: 'Investment' },
    { label: 'Late Payment', value: 'Late Payment' },
    { label: 'Loan and Advances', value: 'Loan and Advances' },
    { label: 'Maintenance & Repairing', value: 'Maintenance & Repairing' },
    { label: 'Provision', value: 'Provision' },
    { label: 'Reserve and Surplus', value: 'Reserve and Surplus' },
    { label: 'Share Capital', value: 'Share Capital' },
    { label: 'Sundry Creditors', value: 'Sundry Creditors' },
    { label: 'Sundry Debtors', value: 'Sundry Debtors' },
    { label: 'Suspense Account', value: 'Suspense Account' },
  ];

  const expenseToGroupsList  = [
    "Account Payable",
    "Current Liabilities",
    "Provision",
    "Reserve and Surplus",
    "Sundry Creditors",
    "Direct Expenses",
    "Indirect Expenses",
    "Maintenance & Repairing",
    "Current Assets",
    "Fixed Assets",
  ]

  const incomeFromGroupsList  = [
    "Direct Income",
    "Indirect Income",
    "Capital Account",
    "Deposit",
    "Investment",
    "Late Payment",
    "Share Capital",
  ]

  const receiptFromToGroupsList  =[
    "Bank Accounts",
    "Cash in Hand",
    "Account Receivable",
    "Investment",
    "Fixed Assets",
    "Current Assets",
    "Sundry Debtors",
    "Loan and Advances",
  ]

  const purchaseToGroupsList  = [
    "Indirect Expenses",
    "Indirect Income",
    "Account Receivable",
    "Current Liabilities",
    "Reserve and Surplus",
    "Current Assets",
    "Deposit", 
    "Direct Expenses",
    "Direct Income",
    "Investment",
    "Capital Account",
    "Account Payable",
    "Late Payment",
    "Loan and Advances",
    "Maintenance & Repairing",
    "Provision",
    "Share Capital",
    "Sundry Creditors",
    "Sundry Debtors",
    "Suspense Account", 
    "Fixed Assets", 
  ]

  const journalFromToGroupList = [
    "Indirect Expenses",
    "Indirect Income",
    "Account Receivable",
    "Current Liabilities",
    "Reserve and Surplus",
    "Deposit",
    "Direct Expenses",
    "Direct Income",
    "Investment",
    "Account Payable",
    "Late Payment",
    "Maintenance & Repairing",
    "Provision",
    "Share Capital",
    "Sundry Creditors",
    "Fixed Assets",
    "Current Assets",
    "Sundry Debtors",
    "Loan and Advances",
    "Capital Account",
    "Suspense Account",
  ]

  const transactionFromToGroupList = [
    "Bank Accounts",
    "Cash in Hand",
    "Indirect Expenses",
    "Indirect Income",
    "Account Receivable",
    "Current Liabilities",
    "Reserve and Surplus",
    "Deposit",
    "Direct Expenses",
    "Direct Income",
    "Investment",
    "Account Payable",
    "Late Payment",
    "Maintenance & Repairing",
    "Provision",
    "Share Capital",
    "Sundry Creditors",
    "Fixed Assets",
    "Current Assets",
    "Sundry Debtors",
    "Loan and Advances",
    "Capital Account",
    "Suspense Account",
  ]

  const billItemLedgerGroupList = [
    "Indirect Income", 
    "Current Liabilities",
    "Reserve and Surplus",
    "Deposit",
    "Direct Income",
    "Capital Account",
    "Account Payable",
    "Provision",
    "Share Capital",
    "Sundry Creditors",
    "Suspense Account",
]
  
export { ledgerGroupsList, expenseToGroupsList, incomeFromGroupsList, receiptFromToGroupsList,
   purchaseToGroupsList, journalFromToGroupList, transactionFromToGroupList, billItemLedgerGroupList };
   
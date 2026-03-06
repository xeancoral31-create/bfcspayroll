export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  basicSalary: number;
  dateHired: string;
  status: "active" | "inactive";
}

export interface Deduction {
  name: string;
  amount: number;
  type: "fixed" | "percentage";
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: Employee;
  period: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  grossPay: number;
  deductions: Deduction[];
  totalDeductions: number;
  netPay: number;
  status: "draft" | "processed" | "paid";
  createdAt: string;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  processedCount: number;
  pendingCount: number;
}

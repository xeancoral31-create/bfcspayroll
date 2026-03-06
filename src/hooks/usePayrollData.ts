import { useState, useEffect, useCallback } from "react";
import type { Employee, PayrollRecord } from "@/types/payroll";

const EMPLOYEES_KEY = "payroll_employees";
const PAYROLL_KEY = "payroll_records";

const defaultDeductions = [
  { name: "SSS", amount: 0.045, type: "percentage" as const },
  { name: "PhilHealth", amount: 0.035, type: "percentage" as const },
  { name: "Pag-IBIG", amount: 100, type: "fixed" as const },
  { name: "Withholding Tax", amount: 0.1, type: "percentage" as const },
];

const sampleEmployees: Employee[] = [
  { id: "1", employeeId: "EMP-001", firstName: "Maria", lastName: "Santos", email: "maria.santos@school.edu", position: "Principal", department: "Administration", basicSalary: 45000, dateHired: "2018-06-15", status: "active" },
  { id: "2", employeeId: "EMP-002", firstName: "Juan", lastName: "Dela Cruz", email: "juan.delacruz@school.edu", position: "Math Teacher", department: "Academics", basicSalary: 28000, dateHired: "2019-03-01", status: "active" },
  { id: "3", employeeId: "EMP-003", firstName: "Ana", lastName: "Reyes", email: "ana.reyes@school.edu", position: "Science Teacher", department: "Academics", basicSalary: 28000, dateHired: "2020-08-10", status: "active" },
  { id: "4", employeeId: "EMP-004", firstName: "Pedro", lastName: "Garcia", email: "pedro.garcia@school.edu", position: "English Teacher", department: "Academics", basicSalary: 26000, dateHired: "2021-01-20", status: "active" },
  { id: "5", employeeId: "EMP-005", firstName: "Rosa", lastName: "Mendoza", email: "rosa.mendoza@school.edu", position: "Registrar", department: "Administration", basicSalary: 22000, dateHired: "2019-07-01", status: "active" },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadFromStorage(EMPLOYEES_KEY, sampleEmployees)
  );

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  const addEmployee = useCallback((emp: Omit<Employee, "id">) => {
    setEmployees((prev) => [...prev, { ...emp, id: crypto.randomUUID() }]);
  }, []);

  const updateEmployee = useCallback((id: string, data: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { employees, addEmployee, updateEmployee, deleteEmployee };
}

export function usePayrollRecords() {
  const [records, setRecords] = useState<PayrollRecord[]>(() =>
    loadFromStorage(PAYROLL_KEY, [])
  );

  useEffect(() => {
    localStorage.setItem(PAYROLL_KEY, JSON.stringify(records));
  }, [records]);

  const processPayroll = useCallback(
    (employee: Employee, period: string, allowances = 0, overtime = 0) => {
      const grossPay = employee.basicSalary + allowances + overtime;
      const deductions = defaultDeductions.map((d) => ({
        ...d,
        amount: d.type === "percentage" ? Math.round(grossPay * (d.amount as number) * 100) / 100 : d.amount,
        type: "fixed" as const,
      }));
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netPay = grossPay - totalDeductions;

      const record: PayrollRecord = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employee,
        period,
        basicSalary: employee.basicSalary,
        allowances,
        overtime,
        grossPay,
        deductions,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round(netPay * 100) / 100,
        status: "processed",
        createdAt: new Date().toISOString(),
      };

      setRecords((prev) => [...prev, record]);
      return record;
    },
    []
  );

  const processPayrollManual = useCallback(
    (employee: Employee, period: string, allowances = 0, overtime = 0, manualDeductions: { name: string; amount: number; type: "fixed" }[]) => {
      const grossPay = employee.basicSalary + allowances + overtime;
      const totalDeductions = manualDeductions.reduce((sum, d) => sum + d.amount, 0);
      const netPay = grossPay - totalDeductions;

      const record: PayrollRecord = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employee,
        period,
        basicSalary: employee.basicSalary,
        allowances,
        overtime,
        grossPay,
        deductions: manualDeductions,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netPay: Math.round(netPay * 100) / 100,
        status: "processed",
        createdAt: new Date().toISOString(),
      };

      setRecords((prev) => [...prev, record]);
      return record;
    },
    []
  );

  const markAsPaid = useCallback((id: string) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "paid" as const } : r)));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { records, processPayroll, markAsPaid, deleteRecord };
}

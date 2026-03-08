import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function usePayrollRecords() {
  return useQuery({
    queryKey: ["payroll_records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_records")
        .select("*, employees(first_name, last_name, employee_id, position, department)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePayrollActions() {
  const queryClient = useQueryClient();

  const addEmployee = async (employee: {
    employee_id: string;
    first_name: string;
    last_name: string;
    position: string;
    basic_salary: number;
    email?: string;
    contact_number?: string;
    date_hired?: string;
  }) => {
    const { error } = await supabase.from("employees").insert({
      ...employee,
      employment_type: employee.position || "Cashier",
      status: employee.status || "active",
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    toast.success("Employee added!");
  };

  const updateEmployee = async (id: string, updates: any) => {
    const { error } = await supabase.from("employees").update(updates).eq("id", id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    toast.success("Employee updated!");
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    toast.success("Employee removed.");
  };

  const processPayroll = async (employeeId: string, data: {
    basic_salary: number;
    overtime: number;
    allowances: number;
    deductions: Record<string, number>;
    period: string;
    period_type: string;
  }) => {
    const grossPay = data.basic_salary + data.overtime + data.allowances;
    const totalDeductions = Object.values(data.deductions).reduce((a, b) => a + b, 0);
    const netPay = grossPay - totalDeductions;

    const { error } = await supabase.from("payroll_records").insert({
      employee_id: employeeId,
      basic_salary: Math.round(data.basic_salary * 100) / 100,
      overtime: Math.round(data.overtime * 100) / 100,
      allowances: Math.round(data.allowances * 100) / 100,
      gross_pay: Math.round(grossPay * 100) / 100,
      deductions: data.deductions as any,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      net_pay: Math.round(netPay * 100) / 100,
      period: data.period,
      period_type: data.period_type,
      status: "processed",
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["payroll_records"] });
    toast.success("Payroll processed!");
  };

  return { addEmployee, updateEmployee, deleteEmployee, processPayroll };
}

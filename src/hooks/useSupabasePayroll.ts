import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbEmployee = Tables<"employees">;
export type DbPayrollRecord = Tables<"payroll_records">;

export function useSupabaseEmployees() {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEmployees(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = useCallback(async (emp: Omit<DbEmployee, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("employees").insert(emp);
    if (error) throw error;
    await fetchEmployees();
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, data: Partial<DbEmployee>) => {
    const { error } = await supabase.from("employees").update(data).eq("id", id);
    if (error) throw error;
    await fetchEmployees();
  }, [fetchEmployees]);

  const deleteEmployee = useCallback(async (id: string) => {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
    await fetchEmployees();
  }, [fetchEmployees]);

  return { employees, loading, addEmployee, updateEmployee, deleteEmployee, refetch: fetchEmployees };
}

export interface PayrollRecordWithEmployee extends DbPayrollRecord {
  employees: DbEmployee;
}

export function useSupabasePayrollRecords() {
  const [records, setRecords] = useState<PayrollRecordWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from("payroll_records")
      .select("*, employees(*)")
      .order("created_at", { ascending: false });
    if (!error && data) setRecords(data as PayrollRecordWithEmployee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const processPayroll = useCallback(
    async (
      employee: DbEmployee,
      period: string,
      periodType: string,
      allowances: number,
      overtime: number,
      deductions: { name: string; amount: number; type: string }[]
    ) => {
      const grossPay = employee.basic_salary + allowances + overtime;
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netPay = grossPay - totalDeductions;

      const { data, error } = await supabase.from("payroll_records").insert({
        employee_id: employee.id,
        period,
        period_type: periodType,
        basic_salary: employee.basic_salary,
        allowances,
        overtime,
        gross_pay: Math.round(grossPay * 100) / 100,
        deductions: deductions as any,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_pay: Math.round(netPay * 100) / 100,
        status: "processed",
      }).select("*, employees(*)").single();

      if (error) throw error;
      await fetchRecords();
      return data;
    },
    [fetchRecords]
  );

  const markAsPaid = useCallback(async (id: string) => {
    const { error } = await supabase.from("payroll_records").update({ status: "paid" }).eq("id", id);
    if (error) throw error;
    await fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from("payroll_records").delete().eq("id", id);
    if (error) throw error;
    await fetchRecords();
  }, [fetchRecords]);

  return { records, loading, processPayroll, markAsPaid, deleteRecord, refetch: fetchRecords };
}

export function useDeductionPresets() {
  const [presets, setPresets] = useState<Tables<"deduction_presets">[]>([]);

  const fetchPresets = useCallback(async () => {
    const { data } = await supabase.from("deduction_presets").select("*").order("created_at");
    if (data) setPresets(data);
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const addPreset = useCallback(async (preset: { name: string; sss: number; philhealth: number; pagibig: number; withholding_tax: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("deduction_presets").insert({ ...preset, created_by: user?.id });
    if (error) throw error;
    await fetchPresets();
  }, [fetchPresets]);

  const deletePreset = useCallback(async (id: string) => {
    const { error } = await supabase.from("deduction_presets").delete().eq("id", id);
    if (error) throw error;
    await fetchPresets();
  }, [fetchPresets]);

  return { presets, addPreset, deletePreset };
}

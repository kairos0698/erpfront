import { Injectable } from '@angular/core';
import { PaymentPeriod } from '../../employee/models/employee.model';

export interface SalaryCalculation {
  employeeId: number;
  employeeName: string;
  baseSalary: number;
  paymentPeriod: PaymentPeriod;
  calculatedDailyRate: number;
  calculatedWeeklyRate: number;
  calculatedBiweeklyRate: number;
  calculatedMonthlyRate: number;
  periodDays: number;
  periodMultiplier: number;
}

export interface PayrollPreview {
  employeeId: number;
  employeeName: string;
  position: string;
  baseSalary: number;
  paymentPeriod: PaymentPeriod;
  calculatedAmount: number;
  workOrdersTotal: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  periodDays: number;
  dailyRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryCalculationService {

  /**
   * Calcula el salario diario basado en el período de pago
   */
  calculateDailyRate(baseSalary: number, paymentPeriod: PaymentPeriod): number {
    switch (paymentPeriod) {
      case PaymentPeriod.DAILY:
        return baseSalary;
      case PaymentPeriod.WEEKLY:
        return baseSalary / 7;
      case PaymentPeriod.BIWEEKLY:
        return baseSalary / 14;
      case PaymentPeriod.MONTHLY:
        return baseSalary / 30;
      case PaymentPeriod.QUARTERLY:
        return baseSalary / 90;
      case PaymentPeriod.ANNUALLY:
        return baseSalary / 365;
      default:
        return baseSalary / 30; // Default to monthly
    }
  }

  /**
   * Calcula el salario para un período específico
   */
  calculatePeriodSalary(baseSalary: number, paymentPeriod: PaymentPeriod, periodDays: number): number {
    const dailyRate = this.calculateDailyRate(baseSalary, paymentPeriod);
    return dailyRate * periodDays;
  }

  /**
   * Obtiene el multiplicador para convertir entre períodos
   */
  getPeriodMultiplier(fromPeriod: PaymentPeriod, toPeriod: PaymentPeriod): number {
    const multipliers = {
      [PaymentPeriod.DAILY]: 1,
      [PaymentPeriod.WEEKLY]: 7,
      [PaymentPeriod.BIWEEKLY]: 14,
      [PaymentPeriod.MONTHLY]: 30,
      [PaymentPeriod.QUARTERLY]: 90,
      [PaymentPeriod.ANNUALLY]: 365
    };

    return multipliers[toPeriod] / multipliers[fromPeriod];
  }

  /**
   * Calcula todos los tipos de salario para un empleado
   */
  calculateAllRates(baseSalary: number, paymentPeriod: PaymentPeriod): SalaryCalculation {
    const dailyRate = this.calculateDailyRate(baseSalary, paymentPeriod);
    
    return {
      employeeId: 0, // Se asignará después
      employeeName: '', // Se asignará después
      baseSalary,
      paymentPeriod,
      calculatedDailyRate: dailyRate,
      calculatedWeeklyRate: dailyRate * 7,
      calculatedBiweeklyRate: dailyRate * 14,
      calculatedMonthlyRate: dailyRate * 30,
      periodDays: this.getPeriodDays(paymentPeriod),
      periodMultiplier: 1
    };
  }

  /**
   * Obtiene el número de días en un período
   */
  private getPeriodDays(paymentPeriod: PaymentPeriod): number {
    switch (paymentPeriod) {
      case PaymentPeriod.DAILY:
        return 1;
      case PaymentPeriod.WEEKLY:
        return 7;
      case PaymentPeriod.BIWEEKLY:
        return 14;
      case PaymentPeriod.MONTHLY:
        return 30;
      case PaymentPeriod.QUARTERLY:
        return 90;
      case PaymentPeriod.ANNUALLY:
        return 365;
      default:
        return 30;
    }
  }

  /**
   * Calcula la nómina para un empleado específico
   */
  calculatePayroll(
    employeeId: number,
    employeeName: string,
    position: string,
    baseSalary: number,
    paymentPeriod: PaymentPeriod,
    startDate: Date,
    endDate: Date,
    workOrdersTotal: number = 0
  ): PayrollPreview {
    const periodDays = this.calculatePeriodDays(startDate, endDate);
    const dailyRate = this.calculateDailyRate(baseSalary, paymentPeriod);
    const calculatedAmount = this.calculatePeriodSalary(baseSalary, paymentPeriod, periodDays);
    const totalAmount = calculatedAmount + workOrdersTotal;

    return {
      employeeId,
      employeeName,
      position,
      baseSalary,
      paymentPeriod,
      calculatedAmount,
      workOrdersTotal,
      totalAmount,
      startDate,
      endDate,
      periodDays,
      dailyRate
    };
  }

  /**
   * Calcula el número de días entre dos fechas
   */
  private calculatePeriodDays(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días
  }

  /**
   * Obtiene la descripción del período de pago en español
   */
  getPaymentPeriodDescription(paymentPeriod: PaymentPeriod): string {
    const descriptions = {
      [PaymentPeriod.DAILY]: 'Diario',
      [PaymentPeriod.WEEKLY]: 'Semanal',
      [PaymentPeriod.BIWEEKLY]: 'Quincenal',
      [PaymentPeriod.MONTHLY]: 'Mensual',
      [PaymentPeriod.QUARTERLY]: 'Trimestral',
      [PaymentPeriod.ANNUALLY]: 'Anual'
    };
    return descriptions[paymentPeriod] || 'Mensual';
  }
}

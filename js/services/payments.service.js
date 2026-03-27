// js/services/payments.service.js
import { supabase } from '../config/supabase.js';

/**
 * Payments Service
 * Responsibility: Handle tracking of commitment fees and student earnings.
 */
class PaymentsService {
  /**
   * Fetches all commitment fee records for a specific student.
   * @param {string} studentId
   */
  async getFeeHistory(studentId) {
    const { data, error } = await supabase
      .from('commitment_fees')
      .select(
        `
        *,
        jobs (
          title
        )
      `
      )
      .eq('student_id', studentId)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('[PaymentsService] Error fetching fee history:', error.message);
      return [];
    }

    // Flatten the result to include job title directly
    return data.map((fee) => ({
      ...fee,
      jobTitle: fee.jobs?.title || 'Unknown Job',
    }));
  }

  /**
   * Records a new commitment fee payment.
   * @param {Object} feeData - { jobId, studentId, amount }
   */
  async payFee(feeData) {
    const { data, error } = await supabase
      .from('commitment_fees')
      .insert([
        {
          job_id: feeData.jobId,
          student_id: feeData.studentId,
          amount: feeData.amount,
          status: 'Held',
        },
      ])
      .select();

    if (error) {
      console.error('[PaymentsService] Error recording payment:', error.message);
      throw error;
    }

    // Also update the application status to 'Confirmed'
    await supabase
      .from('applications')
      .update({ status: 'confirmed' })
      .eq('job_id', feeData.jobId)
      .eq('student_id', feeData.studentId);

    return data[0];
  }

  /**
   * Fetches total earnings for a student (mock logic for now, could be expanded)
   */
  async getEarningsSummary(studentId) {
    // In a real app, this would sum up completed 'applications' where pay is released.
    const { data, error } = await supabase
      .from('applications')
      .select(
        `
        status,
        jobs (
          salary
        )
      `
      )
      .eq('student_id', studentId)
      .eq('status', 'completed');

    if (error) return { total: 0, count: 0 };

    const total = data.reduce((acc, app) => acc + Number(app.jobs?.salary || 0), 0);
    return {
      total,
      count: data.length,
    };
  }
}

export const paymentsService = new PaymentsService();

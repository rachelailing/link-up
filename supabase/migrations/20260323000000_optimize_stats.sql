-- Optimize Student Dashboard Stats
-- Consolidates multiple queries into one RPC call.

CREATE OR REPLACE FUNCTION public.get_student_stats(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_pending_count BIGINT;
    v_active_count BIGINT;
    v_total_earnings DECIMAL(10, 2);
    v_held_fees DECIMAL(10, 2);
BEGIN
    -- 1. Pending Applications
    SELECT count(*) INTO v_pending_count 
    FROM public.applications 
    WHERE student_id = p_student_id AND status = 'pending';

    -- 2. Active Jobs
    SELECT count(*) INTO v_active_count 
    FROM public.applications 
    WHERE student_id = p_student_id AND status IN ('confirmed', 'accepted', 'in progress');

    -- 3. Total Earnings
    SELECT COALESCE(sum(j.salary), 0) INTO v_total_earnings
    FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE a.student_id = p_student_id AND a.status = 'completed';

    -- 4. Held Fees (Commitment Fees)
    SELECT COALESCE(sum(amount), 0) INTO v_held_fees
    FROM public.commitment_fees
    WHERE student_id = p_student_id AND status = 'Held';

    RETURN jsonb_build_object(
        'pending_count', v_pending_count,
        'active_count', v_active_count,
        'total_earnings', v_total_earnings,
        'held_fees', v_held_fees
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

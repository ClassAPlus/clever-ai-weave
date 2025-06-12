
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BusinessInfo } from './types.ts';

export async function saveAssessment(bizInfo: BusinessInfo) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('assessments')
    .insert([{
      business_name: bizInfo.businessName,
      industry: bizInfo.industry,
      employees: bizInfo.employees,
      revenue_range: 'Not collected', // Default value since column is required
      pain_points: bizInfo.painPoints,
      goals: bizInfo.goals
    }]);

  if (error) {
    console.error('Supabase insert error:', error);
  } else {
    console.log('Assessment saved successfully:', data);
  }

  return { data, error };
}

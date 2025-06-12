
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BusinessInfo, ContactInfo } from './types.ts';

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

export async function saveContactRequest(contactInfo: ContactInfo, businessName: string, userName: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Create a more detailed message
  const messageContent = `Contact request from AI assessment.

Business: ${businessName}
Contact Person: ${userName}
Email: ${contactInfo.email}
Phone: ${contactInfo.phone || 'Not provided'}

The client completed an AI assessment and requested LocalEdgeAI to contact them for additional assistance and to discuss a customized quote for their business.`;

  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([{
      first_name: contactInfo.firstName,
      last_name: contactInfo.lastName,
      email: contactInfo.email,
      company: businessName,
      message: messageContent
    }]);

  if (error) {
    console.error('Contact submission error:', error);
  } else {
    console.log('Contact request saved successfully:', data);
  }

  return { data, error };
}

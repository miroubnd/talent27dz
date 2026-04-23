import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const resendApiKey = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Respond to CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content } = await req.json()

    if (!to || !subject || !content) {
      throw new Error("Missing required fields: to, subject, content")
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'TalentDZ <notifications@talentdz.com>', // Ensure domain is verified in Resend
        to: [to],
        subject: subject,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                 <h2 style="color: #1B2A4A;">TalentDZ Notification</h2>
                 <p>${content}</p>
                 <br />
                 <p style="font-size: 12px; color: #64748B;">This is an automated message from the TalentDZ platform.</p>
               </div>`,
      })
    })

    const data = await res.json()

    if (res.ok) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      throw new Error(data.message || 'Error from Resend')
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

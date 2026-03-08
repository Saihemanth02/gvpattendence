import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STUDENTS = [
  { suffix: "002", reg_number: "PG252602002", name: "AKKIREDDY CHANDINI" },
  { suffix: "003", reg_number: "PG252602003", name: "ALLAMRAJU ANANTHA RAMALAKSHMI PUNITHA" },
  { suffix: "004", reg_number: "PG252602004", name: "ARJALA LAXMAN" },
  { suffix: "005", reg_number: "PG252602005", name: "BANGARU KRISHNA" },
  { suffix: "006", reg_number: "PG252602006", name: "BHARGAVI KOLA" },
  { suffix: "007", reg_number: "PG252602007", name: "CHALUMURI YASHWANTH" },
  { suffix: "008", reg_number: "PG252602008", name: "CHAVALI SRI MAHALAKSHMI" },
  { suffix: "009", reg_number: "PG252602009", name: "CHINTALA JNANESWARI DEVI" },
  { suffix: "010", reg_number: "PG252602010", name: "CHITRADA SIDDHARDHA" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const results: string[] = [];

    async function seedUser(
      email: string, password: string, username: string,
      displayName: string, role: "faculty" | "student",
      studentData?: { suffix: string; reg_number: string; name: string }
    ) {
      // Check existing
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = users?.find(u => u.email === email);
      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push(`${username}: exists`);
      } else {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
          },
          body: JSON.stringify({ email, password, email_confirm: true }),
        });
        const body = await res.json();
        if (!res.ok) {
          results.push(`${username}: FAILED - ${JSON.stringify(body)}`);
          return;
        }
        userId = body.id;
        results.push(`${username}: created`);
      }

      // Upsert profile
      await supabaseAdmin.from("profiles").upsert(
        { user_id: userId, username, display_name: displayName, role },
        { onConflict: "user_id" }
      );
      // Upsert role
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: userId, role },
        { onConflict: "user_id,role" }
      );
      // Student record
      if (studentData) {
        await supabaseAdmin.from("students").upsert(
          { ...studentData, user_id: userId },
          { onConflict: "suffix" }
        );
      }
    }

    await seedUser("admin@gvp.faculty", "admin123", "admin", "Admin Faculty", "faculty");

    for (const s of STUDENTS) {
      await seedUser(`${s.suffix}@gvp.student`, "student123", s.suffix, s.name, "student", s);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

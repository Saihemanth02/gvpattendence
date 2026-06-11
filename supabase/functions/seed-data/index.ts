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
  { suffix: "011", reg_number: "PG252602011", name: "DENKADA SASIKALA" },
  { suffix: "012", reg_number: "PG252602012", name: "ELURI ANNAMANI" },
  { suffix: "013", reg_number: "PG252602013", name: "GANDHAM KAVYA DORA" },
  { suffix: "014", reg_number: "PG252602014", name: "GARAPATI DURGA SHREE" },
  { suffix: "015", reg_number: "PG252602015", name: "GUDEPU ANIL KUMAR" },
  { suffix: "016", reg_number: "PG252602016", name: "J JERCY NAYAGI SMITHA" },
  { suffix: "017", reg_number: "PG252602017", name: "JAKKAMPUDI PHANI SREE" },
  { suffix: "018", reg_number: "PG252602018", name: "KANDHUKURI MANISHA" },
  { suffix: "019", reg_number: "PG252602019", name: "KARRI SUSHMA REDDY" },
  { suffix: "020", reg_number: "PG252602020", name: "KATTA SOWJANYA" },
  { suffix: "021", reg_number: "PG252602021", name: "KILLU HARI CHANDHANA" },
  { suffix: "022", reg_number: "PG252602022", name: "KINJARAPU DHANESWARI" },
  { suffix: "023", reg_number: "PG252602023", name: "KINJARAPU VINAY" },
  { suffix: "024", reg_number: "PG252602024", name: "KODUKULA MYTHILI" },
  { suffix: "025", reg_number: "PG252602025", name: "KODURU JAYASURYA" },
  { suffix: "026", reg_number: "PG252602026", name: "KOLLI GOWTHAMII" },
  { suffix: "027", reg_number: "PG252602027", name: "KOMMA MOUNIKA" },
  { suffix: "028", reg_number: "PG252602028", name: "KONGALA MAHITHA" },
  { suffix: "029", reg_number: "PG252602029", name: "KOTTI SRI HASITHA" },
  { suffix: "030", reg_number: "PG252602030", name: "KOVVURI USHA SRI" },
  { suffix: "031", reg_number: "PG252602031", name: "MAMIDI PAVANSAI" },
  { suffix: "033", reg_number: "PG252602033", name: "MUNAGADA CHANDINI" },
  { suffix: "034", reg_number: "PG252602034", name: "MUVVALA SAI LIKITHA" },
  { suffix: "035", reg_number: "PG252602035", name: "NAMBURI MODITHA" },
  { suffix: "037", reg_number: "PG252602037", name: "PANDI PUJITHA" },
  { suffix: "038", reg_number: "PG252602038", name: "PANIGRAHI SUCHITRA" },
  { suffix: "039", reg_number: "PG252602039", name: "PARASU VARUN GANDHI" },
  { suffix: "040", reg_number: "PG252602040", name: "PEDADA RAJASEKHAR" },
  { suffix: "041", reg_number: "PG252602041", name: "POTHIRENDI ASREETHA RATNA SRI" },
  { suffix: "042", reg_number: "PG252602042", name: "RAMBILLI BHARGAV" },
  { suffix: "043", reg_number: "PG252602043", name: "RAPETI LIKITHA RAMYA SRI" },
  { suffix: "044", reg_number: "PG252602044", name: "REVALA HARISH" },
  { suffix: "045", reg_number: "PG252602045", name: "ROUTHU SAI POOJITHA" },
  { suffix: "046", reg_number: "PG252602046", name: "SAMBARA SAI HEMANTH KUMAR" },
  { suffix: "047", reg_number: "PG252602047", name: "SANAPATHI DEEPTHI" },
  { suffix: "048", reg_number: "PG252602048", name: "SESHAPU UMA RANI" },
  { suffix: "049", reg_number: "PG252602049", name: "SURAKALA DEVA CHARAN" },
  { suffix: "050", reg_number: "PG252602050", name: "SURAVARAPU INDU" },
  { suffix: "051", reg_number: "PG252602051", name: "SURISETTI ROSHINI" },
  { suffix: "052", reg_number: "PG252602052", name: "TADEPALLI SHAMITHA" },
  { suffix: "053", reg_number: "PG252602053", name: "TAMADA LAVA KUMAR" },
  { suffix: "054", reg_number: "PG252602054", name: "TEDLAPU KEERTHIKA TEJASIWINI" },
  { suffix: "055", reg_number: "PG252602055", name: "VEERAMRAJU VENKATA NAGA SAI SRIVATS" },
  { suffix: "056", reg_number: "PG252602056", name: "VEGOTI SARVANI" },
  { suffix: "057", reg_number: "PG252602057", name: "WOLLA LAXMI PRASANNA" },
  { suffix: "058", reg_number: "PG252602058", name: "YADAGIRI BHARGAV SREE SAI" },
  { suffix: "059", reg_number: "PG252602059", name: "YEDIDA SHARUNI" },
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

    // Get all existing users once
    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    async function seedUser(
      email: string, password: string, username: string,
      displayName: string, role: "faculty" | "student",
      studentData?: { suffix: string; reg_number: string; name: string }
    ) {
      const existing = allUsers?.find(u => u.email === email);
      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push(`${username}: exists`);
      } else {
        // Drop trigger before creating to avoid duplicate profile inserts
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
          results.push(`${username}: FAILED - ${body.msg || JSON.stringify(body)}`);
          return;
        }
        userId = body.id;
        results.push(`${username}: created`);
      }

      // Upsert profile
      const { error: pErr } = await supabaseAdmin.from("profiles").upsert(
        { user_id: userId, username, display_name: displayName, role },
        { onConflict: "user_id" }
      );
      if (pErr) results.push(`  ${username} profile err: ${pErr.message}`);

      // Upsert role
      const { error: rErr } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: userId, role },
        { onConflict: "user_id,role" }
      );
      if (rErr) results.push(`  ${username} role err: ${rErr.message}`);

      if (studentData) {
        const { error: sErr } = await supabaseAdmin.from("students").upsert(
          { ...studentData, user_id: userId },
          { onConflict: "suffix" }
        );
        if (sErr) results.push(`  ${username} student err: ${sErr.message}`);
      }
    }

    // Faculty
    const facultyPassword = Deno.env.get("FACULTY_PASSWORD") ?? "admin123";
    await seedUser("admin@gvp.faculty", facultyPassword, "admin", "Admin Faculty", "faculty");

    // Students - process in batches of 10 to avoid timeout
    for (let i = 0; i < STUDENTS.length; i += 5) {
      const batch = STUDENTS.slice(i, i + 5);
      await Promise.all(batch.map(s =>
        seedUser(`${s.suffix}@gvp.student`, "student123", s.suffix, s.name, "student", s)
      ));
    }

    return new Response(JSON.stringify({ success: true, results, count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

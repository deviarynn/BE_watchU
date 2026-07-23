const { createClient } = require('@supabase/supabase-js');

const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const checkAndSyncProfile = async (req, res) => {
  try {
    const supabaseUser = req.user; 
    
    const supabase = getSupabase();

    let { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .or(`supabase_id.eq.${supabaseUser.id},email.eq.${supabaseUser.email}`)
      .maybeSingle();

    if (!userProfile) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const nextCustomId = `USR${(count || 0) + 1}`; 

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            user_id: nextCustomId,               
            supabase_id: supabaseUser.id,         
            name: supabaseUser.user_metadata.full_name || 'User Google',
            email: supabaseUser.email,
            password: null
          }
        ])
        .select()
        .single();

      if (insertError) return res.status(500).json({ error: insertError.message });
      userProfile = newUser;
    } 
    else if (!userProfile.supabase_id) {
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ supabase_id: supabaseUser.id })
        .eq('email', supabaseUser.email)
        .select()
        .single();
        
      userProfile = updatedUser;
    }

    return res.json(userProfile);
  } catch (err) {
    return res.status(500).json({ error: 'Terjadi kesalahan server internal' });
  }
};

module.exports = { checkAndSyncProfile };

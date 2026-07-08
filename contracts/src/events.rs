use soroban_sdk::{symbol_short, Address, Env, Symbol};

pub fn emit_issuer_added(env: &Env, admin: &Address, issuer: &Address) {
    let topics = (symbol_short!("issuer_ad"), admin.clone(), issuer.clone());
    env.events().publish(topics, true);
}

pub fn emit_issuer_revoked(env: &Env, admin: &Address, issuer: &Address) {
    let topics = (symbol_short!("issuer_rv"), admin.clone(), issuer.clone());
    env.events().publish(topics, true);
}

pub fn emit_vaccination_minted(env: &Env, patient: &Address, token_id: u64, vaccine_name: Symbol, issuer: &Address) {
    let topics = (symbol_short!("mint_vax"), patient.clone(), issuer.clone());
    env.events().publish(topics, token_id);
}

use crate::storage::{DataKey, VaccinationRecord};
use crate::events::emit_vaccination_minted;
use soroban_sdk::{Address, Env, Symbol, Vec};

pub fn is_issuer_authorized(env: &Env, issuer: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::Issuer(issuer.clone()))
        .unwrap_or(false)
}

pub fn mint_vaccination_record(
    env: &Env,
    patient: Address,
    vaccine: Symbol,
    date: u64,
    issuer: Address,
) -> u64 {
    // 1. Require issuer signature auth
    issuer.require_auth();

    // 2. Check if issuer is in the authorized list
    if !is_issuer_authorized(env, &issuer) {
        panic!("issuer is not authorized");
    }

    // 3. Prevent duplicate minting of the exact same vaccine on the exact same date for this patient
    let mut patient_tokens: Vec<u64> = env
        .storage()
        .persistent()
        .get(&DataKey::PatientRecords(patient.clone()))
        .unwrap_or_else(|| Vec::new(env));

    for token_id in patient_tokens.iter() {
        if let Some(record) = env
            .storage()
            .persistent()
            .get::<_, VaccinationRecord>(&DataKey::Record(token_id))
        {
            if record.vaccine_name == vaccine && record.date == date {
                panic!("duplicate vaccination record");
            }
        }
    }

    // 4. Increment and get next token ID
    let next_id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextTokenId)
        .unwrap_or(1);
    
    env.storage().instance().set(&DataKey::NextTokenId, &(next_id + 1));

    // 5. Create and save record
    let record = VaccinationRecord {
        token_id: next_id,
        vaccine_name: vaccine.clone(),
        date,
        issuer: issuer.clone(),
        timestamp: env.ledger().timestamp(),
    };

    env.storage().persistent().set(&DataKey::Record(next_id), &record);

    // 6. Associate record with patient
    patient_tokens.push_back(next_id);
    env.storage().persistent().set(&DataKey::PatientRecords(patient.clone()), &patient_tokens);

    // 7. Emit event
    emit_vaccination_minted(env, &patient, next_id, vaccine, &issuer);

    next_id
}

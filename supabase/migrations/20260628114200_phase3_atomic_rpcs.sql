-- Phase 3: Atomic RPCs for Consultations

-- 1. Create Consultation RPC
CREATE OR REPLACE FUNCTION create_consultation_rpc(
  p_consultation jsonb,
  p_consumables jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb AS $$
DECLARE
  v_consultation consultations;
  v_orig_app appointments;
  v_user_id uuid;
  v_next_app_date date;
  v_scheduled_at timestamptz;
  v_consumable jsonb;
BEGIN
  v_user_id := auth.uid();
  
  -- Insert consultation
  INSERT INTO consultations (
    appointment_id, patient_id, doctor_id, visit_type, is_first_visit,
    subjective_exam, height_cm, weight_kg, bmi, blood_pressure, heart_rate,
    respiratory_rate, temperature, skin, head_neck, breasts, abdomen,
    gynecological, extremities, neurological, acetic_acid_test, acetic_clock_position,
    acetic_relative_position, lugol_test, lugol_clock_position, lugol_relative_position,
    gestational_age, fetal_weight, obstetric_bp, uterine_height, presentation,
    fetal_heart_rate, fetal_movements, edema, alarm_signs, indications,
    complementary_exams, diagnosis, plan, next_appointment_date, contact_channel
  )
  SELECT 
    (p_consultation->>'appointment_id')::uuid,
    (p_consultation->>'patient_id')::uuid,
    COALESCE((p_consultation->>'doctor_id')::uuid, v_user_id),
    (p_consultation->>'visit_type'),
    (p_consultation->>'is_first_visit')::boolean,
    p_consultation->>'subjective_exam',
    (p_consultation->>'height_cm')::numeric,
    (p_consultation->>'weight_kg')::numeric,
    (p_consultation->>'bmi')::numeric,
    p_consultation->>'blood_pressure',
    (p_consultation->>'heart_rate')::integer,
    (p_consultation->>'respiratory_rate')::integer,
    (p_consultation->>'temperature')::numeric,
    p_consultation->>'skin',
    p_consultation->>'head_neck',
    p_consultation->>'breasts',
    p_consultation->>'abdomen',
    p_consultation->>'gynecological',
    p_consultation->>'extremities',
    p_consultation->>'neurological',
    p_consultation->>'acetic_acid_test',
    p_consultation->>'acetic_clock_position',
    p_consultation->>'acetic_relative_position',
    p_consultation->>'lugol_test',
    p_consultation->>'lugol_clock_position',
    p_consultation->>'lugol_relative_position',
    p_consultation->>'gestational_age',
    (p_consultation->>'fetal_weight')::numeric,
    p_consultation->>'obstetric_bp',
    (p_consultation->>'uterine_height')::numeric,
    p_consultation->>'presentation',
    (p_consultation->>'fetal_heart_rate')::integer,
    p_consultation->>'fetal_movements',
    p_consultation->>'edema',
    p_consultation->>'alarm_signs',
    p_consultation->>'indications',
    p_consultation->>'complementary_exams',
    p_consultation->>'diagnosis',
    p_consultation->>'plan',
    p_consultation->>'next_appointment_date',
    p_consultation->>'contact_channel'
  RETURNING * INTO v_consultation;

  -- Insert consumables if array is not empty
  IF jsonb_array_length(p_consumables) > 0 THEN
    FOR v_consumable IN SELECT * FROM jsonb_array_elements(p_consumables)
    LOOP
      INSERT INTO consultation_consumables (consultation_id, item_name, quantity, unit)
      VALUES (
        v_consultation.id,
        v_consumable->>'item_name',
        (v_consumable->>'quantity')::numeric,
        v_consumable->>'unit'
      );
    END LOOP;
  END IF;

  -- Update appointment status
  UPDATE appointments 
  SET status = 'completada' 
  WHERE id = (p_consultation->>'appointment_id')::uuid;

  -- Create next appointment if next_appointment_date is provided
  IF (p_consultation->>'next_appointment_date') IS NOT NULL THEN
    v_next_app_date := (p_consultation->>'next_appointment_date')::date;
    SELECT * INTO v_orig_app FROM appointments WHERE id = (p_consultation->>'appointment_id')::uuid;
    
    -- Extract time from original appointment and combine with new date
    v_scheduled_at := v_next_app_date + (v_orig_app.scheduled_at::time);
    IF v_scheduled_at IS NULL THEN
      v_scheduled_at := v_next_app_date + time '09:00:00';
    END IF;

    INSERT INTO appointments (
      patient_id, doctor_id, scheduled_at, status, reason, price, created_by
    ) VALUES (
      (p_consultation->>'patient_id')::uuid,
      COALESCE(v_orig_app.doctor_id, (p_consultation->>'doctor_id')::uuid, v_user_id),
      v_scheduled_at,
      'programada',
      'Próxima Cita',
      COALESCE(v_orig_app.price, 0),
      v_user_id
    );
  END IF;

  RETURN to_jsonb(v_consultation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update Consultation RPC
CREATE OR REPLACE FUNCTION update_consultation_rpc(
  p_consultation_id uuid,
  p_patch jsonb,
  p_consumables jsonb DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_consultation consultations;
  v_old_next_date text;
  v_new_next_date text;
  v_orig_app appointments;
  v_existing_next_app appointments;
  v_user_id uuid;
  v_scheduled_at timestamptz;
  v_consumable jsonb;
BEGIN
  v_user_id := auth.uid();

  -- Get old next_appointment_date
  SELECT next_appointment_date INTO v_old_next_date FROM consultations WHERE id = p_consultation_id;
  
  UPDATE consultations SET
    visit_type = COALESCE(p_patch->>'visit_type', visit_type),
    is_first_visit = COALESCE((p_patch->>'is_first_visit')::boolean, is_first_visit),
    subjective_exam = COALESCE(p_patch->>'subjective_exam', subjective_exam),
    height_cm = COALESCE((p_patch->>'height_cm')::numeric, height_cm),
    weight_kg = COALESCE((p_patch->>'weight_kg')::numeric, weight_kg),
    bmi = COALESCE((p_patch->>'bmi')::numeric, bmi),
    blood_pressure = COALESCE(p_patch->>'blood_pressure', blood_pressure),
    heart_rate = COALESCE((p_patch->>'heart_rate')::integer, heart_rate),
    respiratory_rate = COALESCE((p_patch->>'respiratory_rate')::integer, respiratory_rate),
    temperature = COALESCE((p_patch->>'temperature')::numeric, temperature),
    skin = COALESCE(p_patch->>'skin', skin),
    head_neck = COALESCE(p_patch->>'head_neck', head_neck),
    breasts = COALESCE(p_patch->>'breasts', breasts),
    abdomen = COALESCE(p_patch->>'abdomen', abdomen),
    gynecological = COALESCE(p_patch->>'gynecological', gynecological),
    extremities = COALESCE(p_patch->>'extremities', extremities),
    neurological = COALESCE(p_patch->>'neurological', neurological),
    acetic_acid_test = COALESCE(p_patch->>'acetic_acid_test', acetic_acid_test),
    acetic_clock_position = COALESCE(p_patch->>'acetic_clock_position', acetic_clock_position),
    acetic_relative_position = COALESCE(p_patch->>'acetic_relative_position', acetic_relative_position),
    lugol_test = COALESCE(p_patch->>'lugol_test', lugol_test),
    lugol_clock_position = COALESCE(p_patch->>'lugol_clock_position', lugol_clock_position),
    lugol_relative_position = COALESCE(p_patch->>'lugol_relative_position', lugol_relative_position),
    gestational_age = COALESCE(p_patch->>'gestational_age', gestational_age),
    fetal_weight = COALESCE((p_patch->>'fetal_weight')::numeric, fetal_weight),
    obstetric_bp = COALESCE(p_patch->>'obstetric_bp', obstetric_bp),
    uterine_height = COALESCE((p_patch->>'uterine_height')::numeric, uterine_height),
    presentation = COALESCE(p_patch->>'presentation', presentation),
    fetal_heart_rate = COALESCE((p_patch->>'fetal_heart_rate')::integer, fetal_heart_rate),
    fetal_movements = COALESCE(p_patch->>'fetal_movements', fetal_movements),
    edema = COALESCE(p_patch->>'edema', edema),
    alarm_signs = COALESCE(p_patch->>'alarm_signs', alarm_signs),
    indications = COALESCE(p_patch->>'indications', indications),
    complementary_exams = COALESCE(p_patch->>'complementary_exams', complementary_exams),
    diagnosis = COALESCE(p_patch->>'diagnosis', diagnosis),
    plan = COALESCE(p_patch->>'plan', plan),
    next_appointment_date = COALESCE(p_patch->>'next_appointment_date', next_appointment_date),
    contact_channel = COALESCE(p_patch->>'contact_channel', contact_channel),
    updated_at = now()
  WHERE id = p_consultation_id
  RETURNING * INTO v_consultation;

  -- Handle consumables if array was provided (not null)
  IF p_consumables IS NOT NULL THEN
    DELETE FROM consultation_consumables WHERE consultation_id = p_consultation_id;
    
    IF jsonb_array_length(p_consumables) > 0 THEN
      FOR v_consumable IN SELECT * FROM jsonb_array_elements(p_consumables)
      LOOP
        INSERT INTO consultation_consumables (consultation_id, item_name, quantity, unit)
        VALUES (
          v_consultation.id,
          v_consumable->>'item_name',
          (v_consumable->>'quantity')::numeric,
          v_consumable->>'unit'
        );
      END LOOP;
    END IF;
  END IF;

  -- Handle next appointment date change
  v_new_next_date := p_patch->>'next_appointment_date';
  IF v_new_next_date IS NOT NULL AND (v_old_next_date IS NULL OR v_new_next_date != v_old_next_date) THEN
    SELECT * INTO v_orig_app FROM appointments WHERE id = v_consultation.appointment_id;
    
    v_scheduled_at := v_new_next_date::date + (v_orig_app.scheduled_at::time);
    IF v_scheduled_at IS NULL THEN
      v_scheduled_at := v_new_next_date::date + time '09:00:00';
    END IF;

    -- Look for an existing upcoming appointment
    SELECT * INTO v_existing_next_app 
    FROM appointments 
    WHERE patient_id = v_consultation.patient_id 
      AND status = 'programada'
      AND scheduled_at > v_orig_app.scheduled_at
    ORDER BY scheduled_at ASC
    LIMIT 1;

    IF FOUND THEN
      UPDATE appointments SET scheduled_at = v_scheduled_at WHERE id = v_existing_next_app.id;
    ELSE
      INSERT INTO appointments (
        patient_id, doctor_id, scheduled_at, status, reason, price, created_by
      ) VALUES (
        v_consultation.patient_id,
        COALESCE(v_orig_app.doctor_id, v_consultation.doctor_id, v_user_id),
        v_scheduled_at,
        'programada',
        'Próxima Cita',
        COALESCE(v_orig_app.price, 0),
        v_user_id
      );
    END IF;
  END IF;

  RETURN to_jsonb(v_consultation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE public.prescription_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    indications TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select templates
CREATE POLICY "Doctores y admins pueden ver plantillas" ON public.prescription_templates
    FOR SELECT TO authenticated USING (true);

-- Create policy for authenticated users to insert their templates
CREATE POLICY "Usuarios autenticados pueden crear sus plantillas" ON public.prescription_templates
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Create policy for authenticated users to update their templates
CREATE POLICY "Usuarios autenticados pueden actualizar sus plantillas" ON public.prescription_templates
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Create policy for authenticated users to delete their templates
CREATE POLICY "Usuarios autenticados pueden eliminar sus plantillas" ON public.prescription_templates
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create trigger to set updated_at
CREATE OR REPLACE FUNCTION public.handle_prescription_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_prescription_templates_updated_at
    BEFORE UPDATE ON public.prescription_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_prescription_templates_updated_at();

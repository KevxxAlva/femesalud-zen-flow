-- Create the private bucket for clinical attachments
insert into storage.buckets (id, name, public)
values ('clinical-attachments', 'clinical-attachments', false)
on conflict (id) do nothing;

-- Set up policies for the bucket objects
create policy "Authenticated users can upload clinical attachments"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'clinical-attachments'
);

create policy "Authenticated users can view clinical attachments"
on storage.objects for select
to authenticated
using (
  bucket_id = 'clinical-attachments'
);

create policy "Authenticated users can delete clinical attachments"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'clinical-attachments'
);

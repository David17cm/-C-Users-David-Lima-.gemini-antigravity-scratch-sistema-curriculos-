-- Enable auth for this table to work easily row level security
create table public.curriculos (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    nome text not null,
    email text not null,
    telefone text,
    data_nascimento date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id) -- One CV per user for now
);

-- Turn on security
alter table public.curriculos enable row level security;

-- Policies (Assuming the user only edits their own cv)
create policy "Users can view their own curriculo"
    on public.curriculos for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own curriculo"
    on public.curriculos for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own curriculo"
    on public.curriculos for update
    using ( auth.uid() = user_id );

create table "public"."timetable" (
    "id" uuid not null default gen_random_uuid(),
    "week_id" uuid not null default gen_random_uuid(),
    "day" text not null,
    "hour" smallint not null,
    "startTime" text not null,
    "endTime" text not null,
    "subject" text not null,
    "teacher" text not null,
    "room" text not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."timetable" enable row level security;

create table "public"."timetable_specialization" (
    "id" uuid not null default gen_random_uuid(),
    "timetable_id" uuid not null default gen_random_uuid(),
    "specialization" smallint not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."timetable_specialization" enable row level security;

create table "public"."timetable_week" (
    "id" uuid not null default gen_random_uuid(),
    "week_title" text not null,
    "class" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."timetable_week" enable row level security;

CREATE UNIQUE INDEX timetable_pkey ON public.timetable USING btree (id);

CREATE UNIQUE INDEX timetable_specialization_pkey ON public.timetable_specialization USING btree (id);

CREATE UNIQUE INDEX timetable_specialization_specialization_key ON public.timetable_specialization USING btree (specialization);

CREATE UNIQUE INDEX timetable_specialization_timetable_id_key ON public.timetable_specialization USING btree (timetable_id);

CREATE UNIQUE INDEX timetable_week_pkey ON public.timetable_week USING btree (id);

alter table "public"."timetable" add constraint "timetable_pkey" PRIMARY KEY using index "timetable_pkey";

alter table "public"."timetable_specialization" add constraint "timetable_specialization_pkey" PRIMARY KEY using index "timetable_specialization_pkey";

alter table "public"."timetable_week" add constraint "timetable_week_pkey" PRIMARY KEY using index "timetable_week_pkey";

alter table "public"."timetable" add constraint "timetable_week_id_fkey" FOREIGN KEY (week_id) REFERENCES timetable_week(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."timetable" validate constraint "timetable_week_id_fkey";

alter table "public"."timetable_specialization" add constraint "timetable_specialization_specialization_key" UNIQUE using index "timetable_specialization_specialization_key";

alter table "public"."timetable_specialization" add constraint "timetable_specialization_timetable_id_fkey" FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."timetable_specialization" validate constraint "timetable_specialization_timetable_id_fkey";

alter table "public"."timetable_specialization" add constraint "timetable_specialization_timetable_id_key" UNIQUE using index "timetable_specialization_timetable_id_key";

grant delete on table "public"."timetable" to "anon";

grant insert on table "public"."timetable" to "anon";

grant references on table "public"."timetable" to "anon";

grant select on table "public"."timetable" to "anon";

grant trigger on table "public"."timetable" to "anon";

grant truncate on table "public"."timetable" to "anon";

grant update on table "public"."timetable" to "anon";

grant delete on table "public"."timetable" to "authenticated";

grant insert on table "public"."timetable" to "authenticated";

grant references on table "public"."timetable" to "authenticated";

grant select on table "public"."timetable" to "authenticated";

grant trigger on table "public"."timetable" to "authenticated";

grant truncate on table "public"."timetable" to "authenticated";

grant update on table "public"."timetable" to "authenticated";

grant delete on table "public"."timetable" to "service_role";

grant insert on table "public"."timetable" to "service_role";

grant references on table "public"."timetable" to "service_role";

grant select on table "public"."timetable" to "service_role";

grant trigger on table "public"."timetable" to "service_role";

grant truncate on table "public"."timetable" to "service_role";

grant update on table "public"."timetable" to "service_role";

grant delete on table "public"."timetable_specialization" to "anon";

grant insert on table "public"."timetable_specialization" to "anon";

grant references on table "public"."timetable_specialization" to "anon";

grant select on table "public"."timetable_specialization" to "anon";

grant trigger on table "public"."timetable_specialization" to "anon";

grant truncate on table "public"."timetable_specialization" to "anon";

grant update on table "public"."timetable_specialization" to "anon";

grant delete on table "public"."timetable_specialization" to "authenticated";

grant insert on table "public"."timetable_specialization" to "authenticated";

grant references on table "public"."timetable_specialization" to "authenticated";

grant select on table "public"."timetable_specialization" to "authenticated";

grant trigger on table "public"."timetable_specialization" to "authenticated";

grant truncate on table "public"."timetable_specialization" to "authenticated";

grant update on table "public"."timetable_specialization" to "authenticated";

grant delete on table "public"."timetable_specialization" to "service_role";

grant insert on table "public"."timetable_specialization" to "service_role";

grant references on table "public"."timetable_specialization" to "service_role";

grant select on table "public"."timetable_specialization" to "service_role";

grant trigger on table "public"."timetable_specialization" to "service_role";

grant truncate on table "public"."timetable_specialization" to "service_role";

grant update on table "public"."timetable_specialization" to "service_role";

grant delete on table "public"."timetable_week" to "anon";

grant insert on table "public"."timetable_week" to "anon";

grant references on table "public"."timetable_week" to "anon";

grant select on table "public"."timetable_week" to "anon";

grant trigger on table "public"."timetable_week" to "anon";

grant truncate on table "public"."timetable_week" to "anon";

grant update on table "public"."timetable_week" to "anon";

grant delete on table "public"."timetable_week" to "authenticated";

grant insert on table "public"."timetable_week" to "authenticated";

grant references on table "public"."timetable_week" to "authenticated";

grant select on table "public"."timetable_week" to "authenticated";

grant trigger on table "public"."timetable_week" to "authenticated";

grant truncate on table "public"."timetable_week" to "authenticated";

grant update on table "public"."timetable_week" to "authenticated";

grant delete on table "public"."timetable_week" to "service_role";

grant insert on table "public"."timetable_week" to "service_role";

grant references on table "public"."timetable_week" to "service_role";

grant select on table "public"."timetable_week" to "service_role";

grant trigger on table "public"."timetable_week" to "service_role";

grant truncate on table "public"."timetable_week" to "service_role";

grant update on table "public"."timetable_week" to "service_role";



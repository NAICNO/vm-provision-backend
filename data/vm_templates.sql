DO
$$
    DECLARE
        nrec_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('NREC', 'Norwegian Research and Education Cloud') RETURNING provider_id INTO nrec_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('Standard Extra Large', nrec_id, 4, 16, 20, 'GOLD CentOS Stream 9', 'Standard VM for extra large workloads', 'm1.xlarge');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GPU Large', nrec_id, 2, 8, 20, 'vGPU Ubuntu 22.04 LTS', 'GPU VM for medium workloads', 'vgpu.m1.large');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('Standard Large', nrec_id, 2, 8, 20, 'GOLD CentOS Stream 9', 'Standard VM for large workloads', 'm1.large');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('Standard Medium', nrec_id, 1, 4, 20, 'GOLD Ubuntu 22.04 LTS', 'Standard VM for medium workloads', 'm1.medium');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GPU Extra Large', nrec_id, 4, 16, 20, 'vGPU Ubuntu 22.04 LTS', 'Standard VM for extra large workloads', 'vgpu.m1.xlarge');

    END
$$;

DO
$$
    DECLARE
        gcloud_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('Google Cloud', 'Google Cloud') RETURNING provider_id INTO gcloud_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GC Standard Extra Large', gcloud_id, 4, 16, 20, 'CentOS Stream 9', 'GC Standard VM for extra large workloads', 'm1.xlarge');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GC GPU Large', gcloud_id, 2, 8, 20, 'vGPU Ubuntu 22.04 LTS', 'GC GPU VM for medium workloads', 'vgpu.m1.large');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GC Standard Large', gcloud_id, 2, 8, 20, 'CentOS Stream 9', 'GC Standard VM for large workloads', 'm1.large');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GC Standard Medium', gcloud_id, 1, 4, 20, 'Ubuntu 22.04 LTS', 'GC Standard VM for medium workloads', 'm1.medium');
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name) VALUES ('GC GPU Extra Large', gcloud_id, 4, 16, 20, 'vGPU Ubuntu 22.04 LTS', 'GC Standard VM for extra large workloads', 'vgpu.m1.xlarge');

    END
$$;

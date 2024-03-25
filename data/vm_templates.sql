DO
$$
    DECLARE
        nrec_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('NREC', 'Norwegian Research and Education Cloud') RETURNING provider_id INTO nrec_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', nrec_id, 1, 4, 20, 'GOLD Ubuntu 22.04 LTS', 'Standard VM for medium workloads', 'm1.medium', '{ "username": "ubuntu", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_id, 2, 8, 20, 'GOLD CentOS Stream 9', 'Standard VM for large workloads', 'm1.large', '{ "username": "cloud-user",  "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', nrec_id, 4, 16, 20, 'GOLD CentOS Stream 9', 'Standard VM for extra large workloads', 'm1.xlarge', '{ "username": "cloud-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Large', nrec_id, 2, 8, 20, 'vGPU Ubuntu 22.04 LTS', 'GPU VM for medium workloads', 'vgpu.m1.large', '{ "username": "ubuntu", "tags": [ "advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large', nrec_id, 4, 16, 20, 'vGPU Ubuntu 22.04 LTS', 'Standard VM for extra large workloads', 'vgpu.m1.xlarge', '{ "username": "ubuntu", "tags": ["simple", "advanced"]}', false);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_id, 2, 8, 20, 'GOLD CentOS Stream 9', 'Virtual machine without GPU', 'm1.large', '{ "username": "cloud-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Large', nrec_id, 2, 8, 20, 'vGPU Ubuntu 22.04 LTS', 'Virtual machine with GPU', 'vgpu.m1.large', '{ "username": "ubuntu", "tags": [ "simple"]}', true);
    END
$$;

DO
$$
    DECLARE
        gcloud_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('Google Cloud', 'Google Cloud') RETURNING provider_id INTO gcloud_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', gcloud_id, 2, 4, 20, 'ubuntu-os-cloud/ubuntu-2204-lts', 'Standard VM for medium workloads', 'e2-medium', '{ "username": "naic-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', gcloud_id, 2, 8, 20, 'ubuntu-os-cloud/ubuntu-2204-lts', 'Standard VM for large workloads', 'n2-standard-2', '{ "username": "naic-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', gcloud_id, 4, 16, 20, 'ubuntu-os-cloud/ubuntu-2204-lts', 'Standard VM for extra large workloads', 'c2-standard-4', '{ "username": "naic-user", "tags": ["advanced"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', gcloud_id, 2, 8, 20, 'ubuntu-os-cloud/ubuntu-2204-lts', 'Virtual machine without GPU', 'n2-standard-2', '{ "username": "naic-user", "tags": [ "simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', gcloud_id, 4, 16, 20, 'ubuntu-os-cloud/ubuntu-2204-lts', 'Virtual machine with GPU', 'c2-standard-4', '{ "username": "naic-user", "tags": [ "simple"]}', true);


    END
$$;

DO
$$
    DECLARE
        azure_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('Azure', 'Microsoft Azure') RETURNING provider_id INTO azure_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', azure_id, 2, 8, 50, 'Ubuntu-2204-lts', 'Standard VM for medium workloads', 'Standard_F2', '{ "username": "naic-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', azure_id, 4, 16, 100, 'Ubuntu-2204-lts', 'Standard VM for large workloads', 'Standard_F4', '{ "username": "naic-user", "tags": ["advanced"]}', true);

    END
$$;

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
        nrec_uio_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('NREC UiO', 'Norwegian Research and Education Cloud') RETURNING provider_id INTO nrec_uio_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', nrec_uio_id, 1, 4, 20, 'GOLD Ubuntu 24.04 LTS', 'Standard VM for medium workloads', 'm1.medium', '{ "username": "ubuntu", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_uio_id, 2, 8, 20, 'GOLD CentOS Stream 10', 'Standard VM for large workloads', 'm1.large', '{ "username": "cloud-user",  "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', nrec_uio_id, 4, 16, 20, 'GOLD CentOS Stream 10', 'Standard VM for extra large workloads', 'm1.xlarge', '{ "username": "cloud-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large (1 x L40S)', nrec_uio_id, 16, 120, 100, 'vGPU Ubuntu 24.04 LTS', 'GPU VM for large workloads (1 x L40S)', 'gr1.L40S.24g.4xlarge', '{ "username": "ubuntu", "tags": ["simple", "advanced"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_uio_id, 2, 8, 20, 'GOLD CentOS Stream 10', 'Virtual machine without GPU', 'm1.large', '{ "username": "cloud-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large (1 x L40S)', nrec_uio_id, 16, 120, 100, 'vGPU Ubuntu 24.04 LTS', 'Virtual machine with GPU (1 x L40S)', 'gr1.L40S.24g.4xlarge', '{ "username": "ubuntu", "tags": [ "simple"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled)
        VALUES ('Standard Large with JupyterNotebook', nrec_uio_id, 2, 8, 20,
                'GOLD Ubuntu 24.04 LTS',
                'Virtual machine with Jupyter Notebook installed - No GPU', 'm1.large', '{
            "username": "ubuntu",
            "applications": [
              "jupyter-notebook"
            ],
            "tags": [
              "simple"
            ]
          }',
                true);
    END
$$;

DO
$$
    DECLARE
        nrec_uib_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('NREC UiB', 'Norwegian Research and Education Cloud') RETURNING provider_id INTO nrec_uib_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', nrec_uib_id, 1, 4, 20, 'GOLD Ubuntu 24.04 LTS', 'Standard VM for medium workloads', 'm1.medium', '{ "username": "ubuntu", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_uib_id, 2, 8, 20, 'GOLD CentOS Stream 10', 'Standard VM for large workloads', 'm1.large', '{ "username": "cloud-user",  "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', nrec_uib_id, 4, 16, 20, 'GOLD CentOS Stream 10', 'Standard VM for extra large workloads', 'm1.xlarge', '{ "username": "cloud-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large (1 x L40S)', nrec_uib_id, 16, 120, 100, 'vGPU Ubuntu 24.04 LTS', 'GPU VM for large workloads (1 x L40S)', 'gr1.L40S.24g.4xlarge', '{ "username": "ubuntu", "tags": ["simple", "advanced"]}', false);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nrec_uib_id, 2, 8, 20, 'GOLD CentOS Stream 10', 'Virtual machine without GPU', 'm1.large', '{ "username": "cloud-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large (1 x L40S)', nrec_uib_id, 16, 120, 100, 'vGPU Ubuntu 24.04 LTS', 'Virtual machine with GPU (1 x L40S)', 'gr1.L40S.24g.4xlarge', '{ "username": "ubuntu", "tags": [ "simple"]}', true);
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

DO
$$
    DECLARE
        ibm_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('IBM Cloud', 'IBM Cloud') RETURNING provider_id INTO ibm_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 11 Medium', ibm_id, 2, 4, 120, 'CentOS-Stream-10', 'Power 11  VM for medium workloads', 'power11.medium', '{ "username": "root", "tags": ["simple"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 11 Small', ibm_id, 1, 2, 120, 'CentOS-Stream-10', 'Power 11 VM for medium workloads', 'power11.small', '{ "username": "root", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 11 Medium', ibm_id, 2, 4, 120, 'CentOS-Stream-10', 'Power 11  VM for medium workloads', 'power11.medium', '{ "username": "root", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 11 Large', ibm_id, 4, 16, 120, 'CentOS-Stream-10', 'Power 11  VM for large workloads', 'power11.large', '{ "username": "root", "tags": ["advanced"]}', true);


        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 10 Medium', ibm_id, 2, 4, 120, 'CentOS-Stream-10', 'Power 10  VM for medium workloads', 'power10.medium', '{ "username": "root", "tags": ["simple"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 10 Small', ibm_id, 1, 2, 120, 'CentOS-Stream-10', 'Power 10 VM for medium workloads', 'power10.small', '{ "username": "root", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 10 Medium', ibm_id, 2, 4, 120, 'CentOS-Stream-10', 'Power 10  VM for medium workloads', 'power10.medium', '{ "username": "root", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Power 10 Large', ibm_id, 4, 16, 120, 'CentOS-Stream-10', 'Power 10  VM for large workloads', 'power10.large', '{ "username": "root", "tags": ["advanced"]}', true);


    END
$$;


DO
$$
    DECLARE
        nscale_id uuid;
    BEGIN
        INSERT INTO provider (provider_name, description) VALUES ('Nscale', 'NScale') RETURNING provider_id INTO nscale_id;

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Small', nscale_id, 2, 4, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for small workloads', 'g.small', '{ "username": "naic-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', nscale_id, 4, 16, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for medium workloads', 'g.4.standard.40s', '{ "username": "naic-user", "tags": ["simple"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('GPU Extra Large', nscale_id, 128, 2149, 30730, 'ubuntu-24.04-amd-mi250-6.4.1', 'High-performance bare metal server with 4x AMD MI250X GPUs for intensive AI/ML and HPC workloads', 'g.128.mi250x.8', '{ "username": "naic-user", "type": "bare-metal", "tags": ["simple"]}', true);

        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Small', nscale_id, 2, 4, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for small workloads', 'g.small', '{ "username": "naic-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Medium', nscale_id, 4, 16, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for medium workloads', 'g.4.standard.40s', '{ "username": "naic-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Large', nscale_id, 16, 32, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for large workloads', 'g.16.standard.40s', '{ "username": "naic-user", "tags": ["advanced"]}', true);
        INSERT INTO public.vm_template (template_name, provider_id, cpu, ram, storage, os, description, flavor_name, metadata, enabled) VALUES ('Standard Extra Large', nscale_id, 16, 64, 40, 'ubuntu-24.04-amd-mi250-6.4.1', 'AMD-powered VM for extra large workloads', 'g.16.standard', '{ "username": "naic-user", "tags": ["advanced"]}', true);

    END
$$;

locals {
  image_catalog = {
    # Ubuntu 24.04 (Noble Numbat) - NVIDIA H200
    "ubuntu-24.04-nvidia-h200-575.51.03" = {
      id     = "fbdbc028-3bbe-440f-961f-f1f87ad3a6d5"
      name   = "noi-250821-02E03203"
      os     = "ubuntu"
      version = "24.04"
      codename = "Noble Numbat"
      gpu_vendor = "NVIDIA"
      gpu_driver = "575.51.03"
      gpu_models = ["H200"]
      size_gib = 25
    }
    "ubuntu-24.04-nvidia-h200-580.82.07" = {
      id     = "68e8d157-8948-4c6c-8251-37c45f541e30"
      name   = "noi-251006-35671490"
      os     = "ubuntu"
      version = "24.04"
      codename = "Noble Numbat"
      gpu_vendor = "NVIDIA"
      gpu_driver = "580.82.07"
      gpu_models = ["H200"]
      size_gib = 25
    }

    # Ubuntu 22.04 (Jammy Jellyfish) - NVIDIA H200
    "ubuntu-22.04-nvidia-h200-575.51.03" = {
      id     = "2948d409-3e53-4f85-b7b4-8eafab23a230"
      name   = "noi-250901-1468ea81"
      os     = "ubuntu"
      version = "22.04"
      codename = "Jammy Jellyfish"
      gpu_vendor = "NVIDIA"
      gpu_driver = "575.51.03"
      gpu_models = ["H200"]
      size_gib = 25
    }
    "ubuntu-22.04-nvidia-h200-580.82.07" = {
      id     = "c780a01b-53dc-4820-9ff6-3927c9b4221d"
      name   = "noi-251101-033c6f86"
      os     = "ubuntu"
      version = "22.04"
      codename = "Jammy Jellyfish"
      gpu_vendor = "NVIDIA"
      gpu_driver = "580.82.07"
      gpu_models = ["H200"]
      size_gib = 25
    }

    # Ubuntu 24.04 (Noble Numbat) - AMD MI250/MI300
    "ubuntu-24.04-amd-mi250-6.4.1" = {
      id     = "f7a30975-890e-4daa-9167-4d9037a8e160"
      name   = "noi-250901-7f8bf8e7"
      os     = "ubuntu"
      version = "24.04"
      codename = "Noble Numbat"
      gpu_vendor = "AMD"
      gpu_driver = "6.4.1"
      gpu_models = ["MI250", "MI300"]
      size_gib = 15
    }

    # Ubuntu 22.04 (Jammy Jellyfish) - AMD MI250/MI300
    "ubuntu-22.04-amd-mi250-6.4.1" = {
      id     = "6d07fe68-7e10-42ba-8e0a-3d0b97232126"
      name   = "noi-250901-1f06cf57"
      os     = "ubuntu"
      version = "22.04"
      codename = "Jammy Jellyfish"
      gpu_vendor = "AMD"
      gpu_driver = "6.4.1"
      gpu_models = ["MI250", "MI300"]
      size_gib = 15
    }
  }
}

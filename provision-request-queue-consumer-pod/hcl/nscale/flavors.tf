locals {
  flavor_catalog = {
    "g.small" = {
      id     = "000c2726-4988-4cc9-b8ef-cfee4865d988"
      cpus   = 2
      memory = 4
      disk   = 40
    }
    "g.2.standard" = {
      id     = "7df10e29-165c-42c8-93a1-5ae952982cf7"
      cpus   = 2
      memory = 8
      disk   = 20
    }
    "g.4.standard.40s" = {
      id     = "6c57396b-dedb-4492-a7e1-9c50c3c74581"
      cpus   = 4
      memory = 16
      disk   = 40
    }
    "g.4.standard.80s" = {
      id     = "f380a44e-6ec4-4f3d-a317-2e1791c1a26c"
      cpus   = 4
      memory = 16
      disk   = 80
    }
    "g.8.standard.40s" = {
      id     = "d4a9efff-0f3d-4ecb-a606-fcdb3a00caa3"
      cpus   = 8
      memory = 32
      disk   = 40
    }
    "g.16.standard.40s" = {
      id     = "cbaa64d9-1a21-4357-8e9d-69a6c82e2fb5"
      cpus   = 16
      memory = 32
      disk   = 40
    }
    "g.16.standard" = {
      id     = "751151eb-5522-414b-8560-7d358de2c900"
      cpus   = 16
      memory = 64
      disk   = 40
    }
    "g.22.h200.1" = {
      id     = "1d9e96bf-4f0f-40dd-93ea-205f293eaf77"
      cpus   = 22
      memory = 247
      disk   = 100
      gpu = {
        logical_count  = 1
        memory         = 140
        model          = "H200"
        physical_count = 1
        vendor         = "NVIDIA"
      }
    }
    "g.128.mi250x.8" = {
      id        = "ec2b3442-78a7-42fd-87e8-ed9b7754e95d"
      cpus      = 128
      memory    = 2149
      disk      = 30730
      baremetal = true
      gpu = {
        logical_count  = 8
        memory         = 128
        model          = "MI250X"
        physical_count = 4
        vendor         = "AMD"
      }
    }
    "g.192.h200.8" = {
      id        = "6e5986dc-d1b1-4247-bfcd-e4e1ff345f77"
      cpus      = 192
      memory    = 2048
      disk      = 960
      baremetal = true
      gpu = {
        logical_count  = 8
        memory         = 140
        model          = "H200"
        physical_count = 8
        vendor         = "NVIDIA"
      }
    }
  }
}

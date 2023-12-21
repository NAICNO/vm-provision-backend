export interface TFProgressLog {
  '@level': string;
  '@message': string;
  '@module': string;
  '@timestamp': string;
  terraform?: string;
  type: string;
  ui?: string;
  change?: TerraformChange;
  changes?: TerraformChangeSummary;
  outputs?: TerraformOutputs;
  hook?: TerraformHook;
}

interface TerraformChange {
  resource: TerraformResource;
  action: string;
}

interface TerraformResource {
  addr: string;
  module: string;
  resource: string;
  implied_provider: string;
  resource_type: string;
  resource_name: string;
  resource_key?: number | null;
}

interface TerraformChangeSummary {
  add: number;
  change: number;
  import: number;
  remove: number;
  operation: string;
}

interface TerraformOutputs {
  [key: string]: {
    sensitive: boolean;
    type?: string;
    value?: string;
    action?: string;
  };
}

interface TerraformHook {
  resource: TerraformResource;
  action: string;
  id_key?: string;
  id_value?: string;
  elapsed_seconds?: number;
}

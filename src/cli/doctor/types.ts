export interface DoctorPathStatusEntry {
  path: string | null;
  enabled?: boolean;
  exists: boolean | null;
}

export interface DoctorRuleFileStatus {
  active: string | null;
  preferred: string | null;
  exists: boolean;
}

export interface DoctorManagedBlockCounts {
  starts: number;
  ends: number;
}

export interface DoctorTerminalIntegrationStatus {
  path: string;
  exists: boolean;
  configPath: string;
  configExists: boolean;
  provider: string | null;
  ruleBlockStatus: string;
}

export interface DoctorReport {
  platform: string;
  scope: string;
  ruleFileStatus: DoctorRuleFileStatus;
  paths: {
    workflows: DoctorPathStatusEntry;
    agents: DoctorPathStatusEntry;
    skills: DoctorPathStatusEntry;
    commands: DoctorPathStatusEntry;
    prompts: DoctorPathStatusEntry;
  };
  managedBlockStatus: string;
  managedBlockCounts: DoctorManagedBlockCounts;
  terminalIntegration: DoctorTerminalIntegrationStatus | null;
  warnings: string[];
  recommendations: string[];
}

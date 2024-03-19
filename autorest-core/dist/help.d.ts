export interface Help {
    categoryFriendlyName: string;
    activationScope?: string;
    description?: string;
    settings: SettingHelp[];
}
export interface SettingHelp {
    required?: boolean;
    key: string;
    type?: string;
    description: string;
}

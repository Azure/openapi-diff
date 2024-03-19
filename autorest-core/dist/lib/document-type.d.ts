export declare enum DocumentType {
    OpenAPI2,
    OpenAPI3,
    LiterateConfiguration,
    Unknown
}
export declare enum DocumentFormat {
    Markdown,
    Yaml,
    Json,
    Unknown
}
export declare const DocumentExtension: {
    yaml: DocumentFormat;
    yml: DocumentFormat;
    json: DocumentFormat;
    md: DocumentFormat;
    markdown: DocumentFormat;
};
export declare const DocumentPatterns: {
    yaml: string[];
    json: string[];
    markdown: string[];
    all: string[];
};

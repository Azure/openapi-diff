/**
 * The results from calling the 'generate' method via the {@link AutoRestLanguageService/generate}
 *
 */
export interface GenerationResults {
    /** the array of messages produced from the run. */
    messages: Array<string>;
    /** the collection of outputted files.
     *
     * Member keys are the file names
     * Member values are the file contents
     *
     * To Access the files:
     * for( const filename in generated.files ) {
     *   const content = generated.files[filename];
     *   /// ...
     * }
     */
    files: Map<string, string>;
}

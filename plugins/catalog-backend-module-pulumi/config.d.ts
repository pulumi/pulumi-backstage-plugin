import { TaskScheduleDefinitionConfig } from '@backstage/backend-tasks';
export interface Config {
    catalog?: {
        /**
         * List of provider-specific options and attributes
         */
        providers?: {
            /**
             * PulumiEntityProvider configuration
             *
             * Maps provider id with configuration.
             */
            pulumi?: {
                [name: string]: {
                    /**
                     * (Required) The api of the Pulumi integration to use.
                     */
                    api: string;
                    /**
                     * (Required) The organization to use.
                     */
                    organization: string;
                    /**
                     * (Required) The Pulumi Access Token to use.
                     */
                    pulumiAccessToken: string;
                    /**
                     * (Optional) TaskScheduleDefinition for the refresh.
                     */
                    schedule?: TaskScheduleDefinitionConfig;
                };
            };
        };
    };
}

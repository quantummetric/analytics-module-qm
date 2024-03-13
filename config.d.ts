export interface Config {
  app: {
    analytics: {
      qm: {
        /**
         * Controls if plugin is on or off
         * @visibility frontend
         */
        enabled: boolean;
        /**
         *  Turns on console.debug messages
         * @visibility frontend
         */
        debug: boolean;
        /**
         * Sends events to console log instead of quantum metric
         * @visibility frontend
         */
        test: boolean;
        /**
         * Quantum Metric CDN source URL
         * @visibility frontend
         */
        src: string;
        /**
         * Controls wether or not to block on Quantum Metric API
         * @visibility frontend
         */
        async: number;

        // Global attributes to be included on all events
        attributes: {
          /**
           * Key of global attribute field to include on all events sent to Quantum Metric
           * @visibility frontend
           */
          name: string;
          /**
           * Value of global attribute field to include on all events sent to Quantum Metric
           * @visibility frontend
           */
          value: string | number | boolean;
        }[];

        // Event mapping of Backstage events like navigation/search to their Quantum Metric event IDs
        events: {
          mappings: {
            /**
             * Backstage event action like 'search' || 'click' to map to the Quantum Metric event ID
             * @visibility frontend
             */
            name: string;
            /**
             * Quantum Metric event ID to send when the above event name is detected.
             * @visibility frontend
             */
            id: number | string;
          }[];
        };
      };
    };
  };
}

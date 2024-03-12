export interface Config {
  app: {
    analytics: {
      qm: {
        /**
         * Controls if plugin is on or off
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        enabled: boolean;
        /**
         *  Turns on console.debug messages
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        debug: boolean;
        /**
         * Sends events to console log instead of quantum metric
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        test: boolean;
        /**
         * Quantum Metric CDN source URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        src: string;
        /**
         * Controls wether or not to block on Quantum Metric API
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        async: number;
        /**
         * Global attributes to be included on all events
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        attributes: any;

        /**
         * Event mapping of Backstage events like navigation/search to their Quantum Metric event IDs
         * @deepvisibility frontend
         */
        events: {
          mappings: {
            name: string;
            id: number | string;
          }[];
        };
      };
    };
  };
}
  
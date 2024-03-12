export interface Config {
  app: {
    analytics: {
      qm: {
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        enabled: boolean;
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        debug: boolean;
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        test: boolean;
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        src: string;
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        async: number;
        /**
         * Frontend root URL
         * NOTE: Visibility applies to only this field
         * @visibility frontend
         */
        attributes: any;
      };
    };
  };
}

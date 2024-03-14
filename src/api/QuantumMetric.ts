/* eslint-disable no-console */
import { Config } from '@backstage/config';
import {
  AnalyticsApi,
  AnalyticsEvent,
  IdentityApi,
} from '@backstage/core-plugin-api';
import {
  AnalyticsApi as NewAnalyticsApi,
  AnalyticsEvent as NewAnalyticsEvent,
} from '@backstage/frontend-plugin-api';
import {
  Transformer,
  defaultEventTransform,
  defaultTransforms,
} from '../util/transforms';

type eventsConfig = {
  name: string;
  id: number;
};

type attributesConfig = {
  name: string;
  value: string | boolean | number;
};

export type QMConfig = {
  enabled: boolean;
  test: boolean;
  debug: boolean;
  src: string;
  async: boolean;
  globalAttributes: attributesConfig[];
  events: eventsConfig[];
};

export type QuantumMetricAPI = {
  identifyUser: (email: string) => void;
  sendEvent: (
    eventId: number | string,
    conversion?: number | boolean,
    eventValue?: number | string,
    attributes?: Record<string, string | boolean | number | undefined>,
  ) => void;
};

/*
 * Quantum Metric API implementation of Backstage Analytics API
 * @public
 */
export class QuantumMetric implements AnalyticsApi, NewAnalyticsApi {
  private capture: QuantumMetricAPI = {} as QuantumMetricAPI;
  private test: boolean = false;
  private debug: boolean = false;
  private quantumInstalled: boolean = false;
  private eventsMapping: Record<string, number> = {};
  private globalAttributes: Record<string, string | boolean | number> = {};
  private eventTransforms: Record<string, Transformer> = defaultTransforms;

  /*
   * Class constructor is responsible for interpreting and respecting the provided options and config values, and setting
   * the class member variables for use in captureEvent.
   */
  private constructor(options: {
    qmConfig: QMConfig;
    identityApi?: IdentityApi;
    eventTransforms?: Record<string, Transformer>;
    capture?: QuantumMetricAPI;
  }) {
    const { enabled, test, debug, src, async, events } = options.qmConfig;

    if (!enabled) {
      if (debug) console.debug('Quantum Metric Analytics plugin disabled.');
      return {} as QuantumMetric;
    }

    this.test = test;
    this.debug = debug;

    if (window.hasOwnProperty('QuantumMetricAPI')) {
      this.quantumInstalled = true;
    }

    if (options.capture) {
      this.capture = options.capture;
      this.quantumInstalled = true;
    }

    this.installQuantum(async, src).then(() => {
      this.capture =
        options.capture ||
        ((window as any).QuantumMetricAPI as QuantumMetricAPI);

      this.setIdentity(options.identityApi);
    });

    this.setEventsMapping(events);
    this.setEventTransforms(options.eventTransforms);
    this.setGlobalAttributes(options.qmConfig.globalAttributes);
  }

  private setEventTransforms(eventTransforms?: Record<string, Transformer>) {
    if (eventTransforms) {
      this.eventTransforms = eventTransforms;
    }
  }

  private setIdentity(identityApi?: IdentityApi) {
    if (identityApi) {
      if (this.debug)
        console.debug('Identity API provided; Identifying user by email');

      identityApi.getProfileInfo().then((profile) => {
        if (profile?.email) this.capture?.identifyUser(profile.email);
      });
    }
  }

  private setGlobalAttributes(globalAttributes: QMConfig['globalAttributes']) {
    if (globalAttributes) {
      this.globalAttributes = globalAttributes.reduce(
        (prev, curr) => {
          prev[curr.name] = curr.value;
          return prev;
        },
        {} as Record<string, string | boolean | number>,
      );
      if (this.debug)
        console.debug(
          `Global attributes configured: ${JSON.stringify(
            this.globalAttributes,
          )}`,
        );
    }
  }

  private setEventsMapping(events: QMConfig['events']) {
    if (events) {
      this.eventsMapping = events.reduce(
        (prev, curr) => {
          prev[curr.name] = curr.id;
          return prev;
        },
        {} as Record<string, number>,
      );
      if (this.debug)
        console.debug(
          `Event mapping configured: ${JSON.stringify(this.eventsMapping)}`,
        );
    } else if (!events && this.debug) {
      console.debug(
        'Events mapping not passed in, OOTB events will not be sent to Quantum Metric',
      );
    }
  }

  private async installQuantum(async: boolean, src: string) {
    if (this.quantumInstalled) {
      if (this.debug)
        console.debug(`Quantum Metric API already on page; Skipping install`);
      return;
    }

    if (this.debug) console.debug(`Fetching Quantum Metric API from ${src}`);
    const qtm = document.createElement('script');
    qtm.type = 'text/javascript';
    qtm.async = async;
    qtm.src = src;

    // Install before any other script
    const d = document.getElementsByTagName('script')[0];
    if (d.parentNode) {
      d.parentNode.insertBefore(qtm, d);
    }

    await new Promise((resolve) => {
      qtm.addEventListener('load', () => {
        if (this.debug) console.debug('Quantum Metric has been loaded');
        this.quantumInstalled = true;
        resolve('');
      });
    });
  }

  /*
   * validateConfig provides feedback to integrators on invalid configurations
   */
  static validateConfig(config: QMConfig) {
    if (config.debug) console.debug('Starting configuration validation');

    if (!config.src.includes('https://cdn.quantummetric.com/'))
      console.warn(
        'Unexpected source provided; Expected source to start with https://cdn.quantummetric.com/',
      );

    if (config.events) {
      const filteredEvents = config.events.filter(
        (event) => event.name && event.id,
      );
      if (filteredEvents.length !== config.events.length) {
        console.warn(
          'Event mapping passed in that did not specify a name or ID',
        );
      }
    }
    if (config.globalAttributes) {
      const filteredAttributes = config.globalAttributes.filter(
        (attribute) => attribute.name && attribute.value,
      );
      if (filteredAttributes.length !== config.globalAttributes.length) {
        console.warn(
          'Global attribute passed in config that did not specify a name or value',
        );
      }
    }
  }

  /**
   * fromConfig is responsible for translating the backstage config values to options for the constructor.
   */
  static fromConfig(
    config: Config,
    options: {
      identityApi?: IdentityApi;
      eventTransforms?: Record<string, Transformer>;
      capture?: QuantumMetricAPI;
    } = {},
  ) {
    // Get all necessary configuration.
    const enabled = config.getBoolean('app.analytics.qm.enabled');

    // Get all optional configuration. Defaults are set if values are not provided.
    const src = config.getOptionalString('app.analytics.qm.src') ?? '';
    const async = config.getOptionalBoolean('app.analytics.qm.async') ?? false;
    const test = config.getOptionalBoolean('app.analytics.qm.test') ?? false;
    const debug = config.getOptionalBoolean('app.analytics.qm.debug') ?? false;

    // Get all optional complex types. Defaults to empty object if not provided.
    const globalAttributes = (config.getOptional(
      'app.analytics.qm.attributes',
    ) as attributesConfig[]) ?? [{} as attributesConfig];
    const events = (config.getOptional(
      'app.analytics.qm.events.mappings',
    ) as eventsConfig[]) ?? [{} as eventsConfig];

    const qmConfig: QMConfig = {
      enabled, // Disables plugin
      test, // When enabled, events are logged to console instead of sent to Quantum Metric
      debug, // Turns on console.debug messages
      src, // CDN location of Quantum Metric API
      async, // Wether or not to block on loading Quantum Metric API onto the page
      globalAttributes, // Attributes to be included on every event sent to Quantum Metric
      events, // Mapping of OOTB backstage events to Quantum Metric event IDs
    };

    this.validateConfig(qmConfig);

    // Return an instance of the configured provider.
    return new QuantumMetric({
      ...options,
      qmConfig,
    });
  }

  /*
   * captureEvent handles sending events to Quantum Metric via the fetched window API
   */
  captureEvent(event: AnalyticsEvent | NewAnalyticsEvent) {
    if (!this.quantumInstalled) {
      if (this.debug)
        console.debug(
          'Analytics Event sent before Quantum Metric was installed; Returning',
        );
      return;
    }

    if (this.test) {
      console.log(`Test Event received: ${JSON.stringify(event)}; Returning`);
      return;
    }

    if (this.debug) console.debug(`Event received: ${JSON.stringify(event)}`);

    const transformFunc =
      this.eventTransforms[event.action] ?? defaultEventTransform;

    const { eventId, eventValue, conversion, attributes } = transformFunc(
      event,
      this.eventsMapping,
    );
    const attributesWithGlobals = Object.assign(
      {},
      attributes,
      this.globalAttributes, // As the second source object, global properties will overwrite on key collision
    );

    if (this.debug)
      console.debug(
        `Transform ran and received: eventId: ${eventId}, eventValue: ${eventValue}, conversion: ${conversion}, attributes: ${JSON.stringify(
          attributesWithGlobals,
        )}`,
      );

    this.capture.sendEvent(
      eventId,
      conversion,
      eventValue,
      attributesWithGlobals,
    );

    if (this.debug) console.debug(`Event id ${eventId} sent to Quantum Metric`);
  }
}

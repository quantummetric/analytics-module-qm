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

type QMConfig = {
  enabled: boolean;
  test: boolean;
  debug: boolean;
  src: string;
  async: boolean;
  events: eventsConfig[];
};

type QuantumMetricAPI = {
  identifyUser: (email: string) => void;
  sendEvent: (
    eventId: number | string,
    conversion?: number | boolean,
    eventValue?: number | string,
    attributes?: Record<string, string | boolean | number | undefined>
  ) => void;
};

/*
 * Quantum Metric API implementation of Backstage Analytics API
 * @public
 */
export class QuantumMetric implements AnalyticsApi, NewAnalyticsApi {
  private readonly capture: QuantumMetricAPI = {} as QuantumMetricAPI;
  private test: boolean = false;
  private debug: boolean = false;
  private quantumInstalled: boolean = false;
  private eventsMapping: eventsConfig[] = [{} as eventsConfig];
  private eventTransforms: Record<string, Transformer> = defaultTransforms;

  /*
   * Class constructor is responsible for interpreting and respecting the provided options and config values, and setting
   * the class member variables for use in captureEvent.
   */
  private constructor(options: {
    qmConfig: QMConfig;
    identityApi?: IdentityApi;
    eventTransforms?: Record<string, Transformer>;
  }) {
    const { enabled, test, debug, src, async, events } = options.qmConfig;

    if (!enabled) {
      if (debug) console.debug("Quantum Metric Analytics plugin disabled.");
      return {} as QuantumMetric;
    }

    this.test = test;
    this.debug = debug;

    if (window.hasOwnProperty("QuantumMetricAPI")) {
      this.quantumInstalled = true;
    }

    if (src) {
      if (this.debug) console.debug(`Fetching Quantum Metric API from ${src}`);
      this.installQuantum(async, src);
      if (this.debug) console.debug("Quantum Metric has been fetched");
    }

    this.capture = (window as any).QuantumMetricAPI as QuantumMetricAPI;
    if (this.debug) console.debug("Set class capture member variable");

    if (options.identityApi) {
      if (this.debug)
        console.debug("Identity API provided; Identifying user by email");

      // TODO wait for quantum to load
      console.debug("Quantum API loaded");
      options.identityApi.getProfileInfo().then((profile) => {
        if (profile?.email) this.capture?.identifyUser(profile.email);
      });
    }

    if (events) {
      this.eventsMapping = events;
    } else if (!events && debug) {
      console.debug(
        "Events mapping not passed in, OOTB events will not be sent to Quantum Metric"
      );
    }

    if (options.eventTransforms) {
      this.eventTransforms = options.eventTransforms;
    }
  }

  private installQuantum(async: boolean, src: string) {
    if (this.quantumInstalled) {
      return;
    }

    this.quantumInstalled = true;
    const qtm = document.createElement("script");
    qtm.type = "text/javascript";
    qtm.async = async;
    qtm.src = src;

    // Install before any other script
    const d = document.getElementsByTagName("script")[0];
    if (d.parentNode) {
      d.parentNode.insertBefore(qtm, d);
    }
  }

  /*
   * validateConfig creates the guardrails for providing feedback to integrators on invalid configurations.
   */
  static validateConfig(config: QMConfig) {
    if (config.debug) console.debug("Starting configuration validation");

    if (!config.src.includes("https://cdn.quantummetric.com/"))
      console.warn(
        "Unexpected source provided; Expected source to start with https://cdn.quantummetric.com/"
      );

    if (config.events) {
      const filteredEvents = config.events.filter(
        (event) => event.name && event.id
      );
      if (filteredEvents.length !== config.events.length) {
        console.warn(
          "Event mapping passed in that did not specify a name or ID"
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
    } = {}
  ) {
    // Get all necessary configuration.
    const enabled = config.getBoolean("app.analytics.qm.enabled");

    // Get all optional configuration. Defaults are set if values are not provided.
    const src = config.getOptionalString("app.analytics.qm.src") ?? "";
    const async = config.getOptionalBoolean("app.analytics.qm.async") ?? false;
    const test = config.getOptionalBoolean("app.analytics.qm.test") ?? false;
    const debug = config.getOptionalBoolean("app.analytics.qm.debug") ?? false;
    const events = (config.getOptional(
      "app.analytics.qm.events.mappings"
    ) as eventsConfig[]) ?? [{} as eventsConfig];

    const qmConfig: QMConfig = {
      enabled, // Disables plugin
      test, // When enabled, events are logged to console instead of sent to Quantum Metric
      debug, // Turns on console.debug messages
      src, // CDN location of Quantum Metric API
      async, // Wether or not to block on loading Quantum Metric API onto the page
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
    if (this.test) {
      console.log(`Test Event received: ${JSON.stringify(event)}; Returning`);
      return;
    }

    const eventMapping = this.eventsMapping.reduce((prev, curr) => {
      prev[curr.name] = curr.id;
      return prev;
    }, {} as Record<string, number>);

    if (this.debug) console.debug(`Event received: ${JSON.stringify(event)}`);

    const transformFunc =
      this.eventTransforms[event.action] ?? defaultEventTransform;

    const { eventId, eventValue, conversion, attributes } = transformFunc(
      event,
      eventMapping
    );

    if (this.debug)
      console.debug(
        `Transform ran and received: eventId: ${eventId}, eventValue: ${eventId}, conversion: ${conversion}, attributes: ${attributes}`
      );

    this.capture.sendEvent(eventId, conversion, eventValue, attributes);

    if (this.debug) console.debug(`Event id ${eventId} sent to Quantum Metric`);
  }
}

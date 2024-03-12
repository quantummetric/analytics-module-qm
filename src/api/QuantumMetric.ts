import { Config } from "@backstage/config";
import {
  AnalyticsApi,
  AnalyticsEvent,
  IdentityApi,
} from "@backstage/core-plugin-api";
import {
  AnalyticsApi as NewAnalyticsApi,
  AnalyticsEvent as NewAnalyticsEvent,
} from "@backstage/frontend-plugin-api";

type QMConfig = {
  enabled: boolean;
  test: boolean;
  debug: boolean;
  src: string;
  async: boolean;
};

type QuantumMetricAPI = {
  identifyUser: (email: string) => void;
  sendEvent: (
    eventId: number | string,
    conversion: number,
    eventValue: number | string,
    multiDimensionalEventValue?: Record<string, string>
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

  /*
   * Class constructor is responsible for interpreting and respecting the provided options and config values, and setting
   * the class member variables for use in captureEvent.
   */
  private constructor(options: {
    identityApi?: IdentityApi;
    qmConfig: QMConfig;
  }) {
    const { enabled, test, debug, src, async } = options.qmConfig;

    if (!enabled) {
      if (debug) console.debug("Quantum Metric Analytics plugin disabled.");
      return {} as QuantumMetric;
    }

    this.test = test;
    this.debug = debug;

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
      options.identityApi.getProfileInfo().then((profile) => {
        if (profile?.email) this.capture.identifyUser(profile.email);
      });
    }
  }

  private installQuantum(async: boolean, src: string) {
    const qtm = document.createElement("script");
    qtm.type = "text/javascript";
    qtm.async = async;
    qtm.src = src;

    // Install before any other script
    const d = document.getElementsByTagName("script")[0];
    if (d && d.parentNode) {
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
  }

  /**
   * fromConfig is responsible for translating the backstage config values to options for the constructor.
   */
  static fromConfig(
    config: Config,
    options: {
      identityApi?: IdentityApi;
    } = {}
  ) {
    // Get all necessary configuration.
    const enabled = config.getBoolean("app.analytics.qm.enabled");

    // Get all optional configuration. Defaults are set if values are not provided.
    const src = config.getOptionalString("app.analytics.qm.src") ?? "";
    const async = config.getOptionalBoolean("app.analytics.qm.async") ?? false;
    const test = config.getOptionalBoolean("app.analytics.qm.test") ?? false;
    const debug = config.getOptionalBoolean("app.analytics.qm.debug") ?? false;

    const qmConfig: QMConfig = {
      enabled, // Disables plugin
      test, // When enabled, events are logged to console instead of sent to Quantum Metric
      debug, // Turns on console.debug messages
      src, // CDN location of Quantum Metric API
      async, // Wether or not to block on loading Quantum Metric API onto the page
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
    const { action, subject, value, attributes } = event;

    if (this.test) {
      console.log(`Test Event received: ${JSON.stringify(event)}; Returning`);
      return;
    }

    if (this.debug) console.debug(`Event received: ${JSON.stringify(event)}`);

    if (action === "sendEvent") {
      if (!value) return; // TODO comback and remove this hack
      const eventId = value;
      const eventValue = subject;

      this.capture.sendEvent(
        eventId,
        0,
        eventValue,
        attributes as Record<string, string>
      );
    }
  }
}

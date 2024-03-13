import { AnalyticsEvent } from '@backstage/core-plugin-api';
import { AnalyticsEvent as NewAnalyticsEvent } from '@backstage/frontend-plugin-api';

/*
 * Transformers take in Backstage analytics events and transform the data to fit what is expected by the Quantum Metric
 * API.
 */
export type Transformer = (
  event: AnalyticsEvent | NewAnalyticsEvent,
  eventMapping: Record<
    AnalyticsEvent['action'] | NewAnalyticsEvent['action'],
    QuantumEvent['eventId']
  >,
) => QuantumEvent;

type QuantumEvent = {
  eventId: number | string;
  conversion?: boolean | number;
  eventValue?: number | string;
  attributes?: Record<string, string | boolean | number | undefined>;
};

// Generic "sendEvent" actions
const sendEventTransform: Transformer = (event) => {
  const { subject, value, attributes } = event;
  const quantumEvent = {
    eventId: subject,
    eventValue: value,
    attributes: attributes,
    conversion: false,
  };
  return quantumEvent;
};

// OOTB "Navigation" actions
const navigationEventTransform: Transformer = (event, eventMapping) => {
  const { action, subject, attributes, context } = event;
  const quantumEvent = {
    eventId: eventMapping[action],
    eventValue: subject,
    attributes: { ...attributes, ...context },
    conversion: false,
  };

  return quantumEvent;
};

// OOTB "Search" actions
const searchEventTransform: Transformer = (event, eventMapping) => {
  const { action, subject, value, attributes, context } = event;
  const quantumEvent = {
    eventId: eventMapping[action],
    eventValue: subject,
    attributes: { ...attributes, "results-found": value, ...context },
    conversion: false,
  };

  return quantumEvent;
};

// OOTB "Discover" actions
const discoverEventTransform: Transformer = (event, eventMapping) => {
  const { action, subject, value, attributes, context } = event;
  const quantumEvent = {
    eventId: eventMapping[action],
    eventValue: subject,
    attributes: { ...attributes, "search-position": value, ...context },
    conversion: false,
  };

  return quantumEvent;
};

// OOTB "Click" actions
const clickEventTransform: Transformer = (event, eventMapping) => {
  const { action, subject, attributes, context } = event;
  const quantumEvent = {
    eventId: eventMapping[action],
    eventValue: subject,
    attributes: { ...attributes, ...context },
    conversion: false,
  };

  return quantumEvent;
};

export const defaultEventTransform: Transformer = (event, eventMapping) => {
  const { action, subject, value, attributes, context } = event;
  const quantumEvent = {
    eventId: eventMapping[action],
    eventValue: value ?? subject,
    attributes: { ...attributes, ...context },
    conversion: false,
  };

  return quantumEvent;
};

export const defaultTransforms: Record<string, Transformer> = {
  navigate: navigationEventTransform,
  search: searchEventTransform,
  discover: discoverEventTransform,
  "not-found": defaultEventTransform,
  click: clickEventTransform,
  sendEvent: sendEventTransform,
};

/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ConfigReader } from '@backstage/config';
import { IdentityApi } from '@backstage/core-plugin-api';
import { QuantumMetric, QuantumMetricAPI } from './QuantumMetric';

let mockQuantumMetricAPI: QuantumMetricAPI;
let mockIdentityApi: IdentityApi;
let insertBeforeMock: any;

const defaultAttributes: any = {
  environment: 'development',
  value: '0.0.1',
};

const mappedDefaultAttributes = Object.keys(defaultAttributes).map((k) => ({
  name: k,
  value: defaultAttributes[k],
}));

const TEST_EVENTS: any = {
  NAVIGATE: {
    NAME: 'navigate',
    ID: '1',
  },
  CLICK: {
    NAME: 'click',
    ID: '2',
  },
  CREATE: {
    NAME: 'create',
    ID: '3',
  },
  SEARCH: {
    NAME: 'search',
    ID: '4',
  },
  DISCOVER: {
    NAME: 'discover',
    ID: '5',
  },
  NOTFOUND: {
    NAME: 'not-found',
    ID: '6',
  },
};

const defaultConfig = {
  app: {
    analytics: {
      qm: {
        enabled: true,
        debug: true,
        test: false,
        src: 'https://cdn.quantummetric.com/qscripts/blahblah-qmplatform.js',
        async: true,
        events: {
          mappings: Object.keys(TEST_EVENTS).map((k) => ({
            name: TEST_EVENTS[k].NAME,
            id: TEST_EVENTS[k].ID,
          })),
          attributes: mappedDefaultAttributes,
        },
      },
    },
  },
};


beforeEach(() => {
  mockQuantumMetricAPI = {
    identifyUser: jest.fn(),
    sendEvent: jest.fn(),
  };
  // Create a mock implementation for IdentityApi
  mockIdentityApi = {
    getProfileInfo: jest.fn().mockResolvedValue({
      email: 'test@example.com',
      displayName: 'Test User',
      id: 'user-123',
    }),
    getBackstageIdentity: jest.fn().mockResolvedValue({
      type: 'user',
      userEntityRef: 'test@example.com',
      ownershipEntityRefs: [],
    }),
    getCredentials: jest.fn().mockResolvedValue({
      token: 'abc123',
    }),
    signOut: jest.fn().mockResolvedValue(true),
  };

  // Create a mock for insertBefore method
  insertBeforeMock = jest.fn();

  // Mock document.getElementsByTagName to return a fake script node array
  document.getElementsByTagName = jest.fn().mockImplementation((tagName) => {
    if (tagName === 'script') {
      // Return an array with a mock script node
      return [
        {
          parentNode: {
            insertBefore: insertBeforeMock,
          },
        },
      ];
    }
    // Return an empty array for other tags
    return [];
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Quantum Metric', () => {
  const context = {
    extension: 'App',
    pluginId: 'some-plugin',
    routeRef: 'unknown',
    releaseNum: 1337,
  };
  const basicValidConfig = new ConfigReader(defaultConfig);

  describe('fromConfig', () => {
    it('throws when missing src', () => {
      const config = new ConfigReader({ app: { analytics: { ga4: {} } } });
      expect(() => QuantumMetric.fromConfig(config)).toThrow(
        /Missing required config value/,
      );
    });

    it('returns implementation', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      expect(api.captureEvent).toBeDefined();

      api.captureEvent({
        action: TEST_EVENTS.NAVIGATE.NAME,
        subject: '/',
        context,
        attributes: defaultAttributes,
      });
      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.NAVIGATE.ID,
        false,
        '/',
        {
          ...defaultAttributes,
          ...context,
        },
      );
    });
  });

  describe('test mode', () => {
    const testConfig = new ConfigReader({
      app: {
        analytics: {
          qm: {
            enabled: true,
            debug: true,
            test: true,
            src: 'https://cdn.quantummetric.com/qscripts/blahblah-qmplatform.js',
            async: true,
            events: {
              mappings: Object.keys(TEST_EVENTS).map((k) => ({
                name: TEST_EVENTS[k].NAME,
                id: TEST_EVENTS[k].ID,
              })),
              attributes: Object.keys(defaultAttributes).map((k) => ({
                name: k,
                value: defaultAttributes[k],
              })),
            },
          },
        },
      },
    });
    it('does not send QM events', () => {
      const api = QuantumMetric.fromConfig(testConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      api.captureEvent({
        action: TEST_EVENTS.NAVIGATE.NAME,
        subject: '/',
        context,
        attributes: defaultAttributes,
      });
      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('navigate', () => {
    it('uses proper default mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });
      api.captureEvent({
        action: TEST_EVENTS.NAVIGATE.NAME,
        subject: '/',
        context,
        attributes: defaultAttributes,
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.NAVIGATE.ID,
        false,
        '/',
        {
          ...defaultAttributes,
          ...context,
        },
      );
    });
  });

  describe('search', () => {
    it('uses proper mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });
      const searchContext = {
        routeRef: 'unknown',
        pluginId: 'search',
        extension: 'SearchBar',
        searchTypes: '',
      };
      api.captureEvent({
        action: TEST_EVENTS.SEARCH.NAME,
        subject: 'test',
        value: 15,
        context: searchContext,
        attributes: defaultAttributes,
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.SEARCH.ID,
        false,
        'test',
        {
          ...defaultAttributes,
          'results-found': 15,
          ...searchContext,
        },
      );
    });
  });

  describe('click', () => {
    it('uses proper mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      const clickContext = {
        routeRef: 'catalog',
        pluginId: 'catalog',
        extension: 'CatalogIndexPage',
      };

      api.captureEvent({
        action: TEST_EVENTS.CLICK.NAME,
        subject: 'server',
        context: clickContext,
        attributes: {
          ...defaultAttributes,
        },
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.CLICK.ID,
        false,
        'server',
        {
          ...defaultAttributes,
          ...clickContext,
        },
      );
    });
  });

  describe('create', () => {
    it('uses proper mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      const createContext = {
        routeRef: 'scaffolder',
        pluginId: 'scaffolder',
        extension: 'ScaffolderPage',
        entityRef: 'template:default/documentation-template',
      };

      api.captureEvent({
        action: TEST_EVENTS.CREATE.NAME,
        subject: 'test',
        context: createContext,
        attributes: {
          ...defaultAttributes,
        },
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.CREATE.ID,
        false,
        'test',
        {
          ...defaultAttributes,
          ...createContext,
        },
      );
    });
  });

  describe('discover', () => {
    it('uses proper mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      const discoverContext = {
        routeRef: 'unknown',
        pluginId: 'search',
        extension: 'SearchResult',
        searchTypes: '',
      };

      api.captureEvent({
        action: TEST_EVENTS.DISCOVER.NAME,
        subject: 'test',
        context: discoverContext,
        attributes: {
          ...defaultAttributes,
        },
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.DISCOVER.ID,
        false,
        'test',
        {
          ...defaultAttributes,
          ...discoverContext,
        },
      );
    });
  });

  describe('not found', () => {
    it('uses proper mappings', () => {
      const api = QuantumMetric.fromConfig(basicValidConfig, {
        identityApi: mockIdentityApi,
        capture: mockQuantumMetricAPI,
      });

      const notFoundContext = {
        routeRef: 'unknown',
        pluginId: 'search',
        extension: 'SearchResult',
        searchTypes: '',
      };

      api.captureEvent({
        action: TEST_EVENTS.NOTFOUND.NAME,
        subject: 'test',
        context: notFoundContext,
        attributes: {
          ...defaultAttributes,
        },
      });

      expect(mockQuantumMetricAPI.sendEvent).toHaveBeenCalledWith(
        TEST_EVENTS.NOTFOUND.ID,
        false,
        'test',
        {
          ...defaultAttributes,
          ...notFoundContext,
        },
      );
    });
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BackendModule, ReadCallback } from "i18next";

interface AsyncStorageBackendOptions {
  expirationTime?: number; 
  versions?: Record<string, Record<string, string>>; 
  prefix?: string; 
}

const DEFAULT_PREFIX = "i18next_res_";
const DEFAULT_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class AsyncStorageBackend implements BackendModule {
  type = "backend" as const;

  private options: Required<AsyncStorageBackendOptions> = {
    expirationTime: DEFAULT_EXPIRATION,
    versions: {},
    prefix: DEFAULT_PREFIX,
  };

  constructor(
    services: any,
    backendOptions: AsyncStorageBackendOptions = {},
    i18nextOptions: any = {}
  ) {
    this.options = {
      ...this.options,
      ...backendOptions,
    };
  }

  init(services: any, backendOptions: AsyncStorageBackendOptions, i18nextOptions: any): void {
    
  }

  read(language: string, namespace: string, callback: ReadCallback): void {
    const key = `${this.options.prefix}${language}|${namespace}`;
    const versionKey = `${key}_version`;
    const expirationKey = `${key}_expiration`;

    AsyncStorage.multiGet([key, versionKey, expirationKey])
      .then((results) => {
        const [[, data], [, version], [, expiration]] = results;

        
        if (expiration) {
          const expirationTime = parseInt(expiration, 10);
          if (Date.now() > expirationTime) {
            return callback(null, null); 
          }
        }

        
        const langVersions = this.options.versions[language];
        const expectedVersion = langVersions?.[namespace];
        if (expectedVersion && version !== expectedVersion) {
          return callback(null, null); 
        }

        // Return cached data
        if (data) {
          try {
            const parsed = JSON.parse(data);
            callback(null, parsed);
          } catch (error) {
            callback(error as Error, null);
          }
        } else {
          callback(null, null);
        }
      })
      .catch((error) => {
        callback(error, null);
      });
  }

  create(languages: string[], namespace: string, key: string, fallbackValue: string): void {
    
  }

  store(language: string, namespace: string, data: any): void {
    const key = `${this.options.prefix}${language}|${namespace}`;
    const versionKey = `${key}_version`;
    const expirationKey = `${key}_expiration`;

    const expirationTime = Date.now() + this.options.expirationTime;
    const langVersions = this.options.versions[language];
    const version = langVersions?.[namespace] || "1";

    AsyncStorage.multiSet([
      [key, JSON.stringify(data)],
      [versionKey, version],
      [expirationKey, expirationTime.toString()],
    ]).catch((error) => {
      console.error("Failed to save i18n cache:", error);
    });
  }
}

export default AsyncStorageBackend;


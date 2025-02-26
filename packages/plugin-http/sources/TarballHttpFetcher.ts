import {Fetcher, FetchOptions, MinimalFetchOptions} from '@yarnpkg/core';
import {Locator, MessageName}                       from '@yarnpkg/core';
import {httpUtils, structUtils, tgzUtils}           from '@yarnpkg/core';

import {TARBALL_REGEXP, PROTOCOL_REGEXP}            from './constants';

export class TarballHttpFetcher implements Fetcher {
  supports(locator: Locator, opts: MinimalFetchOptions) {
    if (!TARBALL_REGEXP.test(locator.reference))
      return false;

    if (PROTOCOL_REGEXP.test(locator.reference))
      return true;

    return false;
  }

  getLocalPath(locator: Locator, opts: FetchOptions) {
    return null;
  }

  async fetch(locator: Locator, opts: FetchOptions) {
    const expectedChecksum = opts.checksums.get(locator.locatorHash) || null;

    const [packageFs, releaseFs, checksum] = await opts.cache.fetchPackageFromCache(
      locator,
      expectedChecksum,
      async () => {
        opts.report.reportInfoOnce(MessageName.FETCH_NOT_CACHED, `${structUtils.prettyLocator(opts.project.configuration, locator)} can't be found in the cache and will be fetched from the remote server`);
        return await this.fetchFromNetwork(locator, opts);
      },
    );

    return {
      packageFs,
      releaseFs,
      prefixPath: structUtils.getIdentVendorPath(locator),
      checksum,
    };
  }

  async fetchFromNetwork(locator: Locator, opts: FetchOptions) {
    const sourceBuffer = await httpUtils.get(locator.reference, {
      configuration: opts.project.configuration,
    });

    return await tgzUtils.convertToZip(sourceBuffer, {
      compressionLevel: opts.project.configuration.get(`compressionLevel`),
      prefixPath: structUtils.getIdentVendorPath(locator),
      stripComponents: 1,
    });
  }
}

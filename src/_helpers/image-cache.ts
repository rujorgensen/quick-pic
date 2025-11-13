export class ImageCache {
    private readonly map: Map<string, Blob> = new Map();
    private readonly used: Map<string, Date> = new Map();

    constructor(
        private readonly CACHE_SIZE_LIMIT: number,
    ) {
        setInterval(() => {
            this.evictLastUsed();
        }, 1000 * 60 * 60 * 24 * 7); // 7 days
    }

    /**
     * Checks if the image is in the cache already.
     */
    public checkCache(
        url: string,
    ): Blob | undefined {
        const existing: Blob | undefined = this.map.get(url);

        if (existing) {
            this.used.set(url, new Date());
        }

        return existing;
    }

    /**
     * Updates the cache with a new image.
     */
    public updateCache(
        url: string,
        blob: Blob,
    ): void {
        if (blob.size > this.CACHE_SIZE_LIMIT) {
            console.log(`Blob size too large (${blob.size}), skipping cache.`);

            return;
        }

        if ((this.getTotalCacheSizeBytes() + blob.size) > this.CACHE_SIZE_LIMIT) {
            console.log(`Resulting cache size limit reached (${(this.getTotalCacheSizeBytes() + blob.size)}). Evicting old entries.`);

            let evicted: number = 0;

            do {
                evicted++;
                this.evictLastUsed();
            } while ((this.map.size > 0) && (this.getTotalCacheSizeBytes() + blob.size) > this.CACHE_SIZE_LIMIT);

            console.log(`Evicted ${evicted} entries, resulting size: ${(this.getTotalCacheSizeBytes() + blob.size)}.`);
        }

        this.used.set(url, new Date());
        this.map.set(url, blob);
    }

    /**
     * Returns the total size of the cache in bytes.
     */
    private getTotalCacheSizeBytes(

    ): number {
        return Array.from(this.map.values())
            .reduce((accumulator: number, blob: Blob) => accumulator + blob.size, 0);
    }

    /**
     * Removes the least recently used item from the cache.
     */
    private evictLastUsed(

    ) {
        if (this.map.size === 0) {
            return;
        }

        if (this.used.size === 0) {
            return;
        }

        let lowestKnownDate: [string, Date] | undefined;

        for (const [url, date] of this.used) {
            if (lowestKnownDate === undefined) {
                lowestKnownDate = [url, date];
                continue;
            }

            if (lowestKnownDate[1] > date) {
                lowestKnownDate = [url, date];
            }
        }

        if (lowestKnownDate === undefined) {
            throw new Error(`Nothing found, this is unexpected`);
        }

        console.log(`Evicting ${lowestKnownDate[0]} from cache. Last used: ${lowestKnownDate[1]}.`);

        this.map.delete(lowestKnownDate[0]);
        this.used.delete(lowestKnownDate[0]);
    }
}


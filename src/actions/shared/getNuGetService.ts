import { getFetchOptions } from '../../utils';
import { getFetchConfig } from '../../utils/getFetchOptions';
import fetch from 'node-fetch';

export const SEARCH_SERVICE = "SearchQueryService";
export const VERSION_SERVICE = "PackageBaseAddress";

interface Entry {
    type: string,
    url: string
}

var index: Promise<Entry[]>;

export function getNuGetService(type: string): Thenable<string> {
    if (!index) {
        index = fetch("https://api.nuget.org/v3/index.json", getFetchOptions(getFetchConfig()))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to query NuGet service index. Please try again later.");
                }

                return response.json();
            })
            .then((response) => {
                return response.resources.map(resource => {
                    return {
                        type: resource["@type"],
                        url: resource["@id"]
                    };
                });
            });
    }

    return index.then((entries) => {
        let entry = entries.find((entry) => entry.type == type);
        if (!entry) {
            entry = entries.find((entry) => entry.type.substr(0, type.length) == type);
        }
        if (!entry) {
            throw new Error(`Failed to find ${type} in the NuGet service index.`);
        }
        return entry.url;
    });
}
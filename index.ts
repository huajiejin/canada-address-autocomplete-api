import express, { Express } from 'express';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';
import fs from 'fs';
import { LatLonGeoLocation, QueryDslQueryContainer, SearchRequest, SortCombinations } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { PRUID_TO_PROVINCE, PRUID_TO_PROVINCE_ABBR, Pruid } from './constants';

if (require.main === module) {
	// start the server if this script is run directly
	// load .env file
	dotenv.config();

	const API_PORT = process.env.API_PORT || 3000;

	const ES_ENDPOINT = process.env.ES_ENDPOINT;
	if (!ES_ENDPOINT) {
		console.error("Missing ES_ENDPOINT environment variable");
		process.exit(1);
	}

	const ES_CA_CERT = process.env.ES_CA_CERT;
	if (!ES_CA_CERT) {
		console.error("Missing ES_CA_CERT environment variable");
		process.exit(1);
	}

	const ES_USERNAME = process.env.ES_USERNAME;
	if (!ES_USERNAME) {
		console.error("Missing ES_USERNAME environment variable");
		process.exit(1);
	}

	const ES_PASSWORD = process.env.ES_PASSWORD;
	if (!ES_PASSWORD) {
		console.error("Missing ES_PASSWORD environment variable");
		process.exit(1);
	}

	const ES_INDEX = process.env.ES_INDEX;
	if (!ES_INDEX) {
		console.error("Missing ES_INDEX environment variable");
		process.exit(1);
	}

	const app = express();

	const esClient = new Client({
		node: ES_ENDPOINT,
		tls: {
			ca: fs.readFileSync(ES_CA_CERT),
			rejectUnauthorized: false,
		},
		auth: {
			username: ES_USERNAME,
			password: ES_PASSWORD,
		},
	});

	setup({
		app,
		esClient,
		port: API_PORT,
		esIndex: ES_INDEX,
	});
}

export async function setup(options: SetupOptions) {
	return new Promise<void>((resolve) => {
		const { app, esClient, port, esIndex } = options;

		app.get("/autocomplete", async (req, res) => {
			const { q, lat, lon } = req.query;

			const filter: QueryDslQueryContainer[] = [
				// full_addr, city, pruid are required fields
				{ exists: { field: "full_addr" } },
				{ exists: { field: "city" } },
				{ exists: { field: "pruid" } },
			];
			const query: QueryDslQueryContainer = {
				bool: {
					must: [
						{
							// match_phrase_prefix will match "123 Main St" with "123 Main Street"
							match_phrase_prefix: { full_addr: q?.toString() || "", },
						},
					],
					filter,
				},
			}
			const sort: SortCombinations[] = [];
			const searchRequestBody: SearchRequest['body'] = {
				_source: ["full_addr", "city", "postal_code", "pruid", "location"],
				query,
				sort,
			};
			// if user provides lat and lon, sort by distance
			if (lat && lon) {
				const location: LatLonGeoLocation = {
					lon: parseFloat(lon.toString()),
					lat: parseFloat(lat.toString()),
				}
				sort.push({
					_geo_distance: {
						location,
						order: "asc",
						unit: "km",
						mode: "min",
						distance_type: "plane",
						ignore_unmapped: true,
					},
				});
			}

			try {
				const result = await esClient.search({
					index: esIndex,
					size: 20,
					body: searchRequestBody,
				});

				const addresses: Address[] = result.hits.hits.map((hit) => {
					const address = hit._source as Address;
					const { full_addr, city, pruid, postal_code, location } = address;
					// distance is the first element in the sort array
					const distance = hit.sort?.[0];
					return {
						full_addr,
						city,
						pruid,
						postal_code,
						provice: PRUID_TO_PROVINCE[pruid as Pruid] || '',
						provice_abbr: PRUID_TO_PROVINCE_ABBR[pruid as Pruid] || '',
						location,
						distance
					};
				});

				res.json(addresses);
			} catch (error) {
				console.error(error);
				res.status(500).json({ error: "Internal Server Error" });
			}
		});

		app.get("/", (req, res) => {
			res.send("OK");
		});

		app.listen(port, () => {
			console.log(`Canada Address Autocomplete API is running on port ${port}, http://localhost:${port}`);
			resolve();
		});
	});
};


// Types
export interface Address {
	full_addr: string;
	city: string;
	pruid: Pruid;
	provice: string;
	provice_abbr: string;
	postal_code?: string;
	location: LatLonGeoLocation;
}
export interface SetupOptions {
	app: Express;
	esClient: Client;
	port: number | string;
	esIndex: string;
}

import { Client } from '@elastic/elasticsearch'
import EsClientMock from '@elastic/elasticsearch-mock'
import { describe, test, expect, beforeAll } from 'vitest'
import { setup } from './index'
import express from 'express'

const app = express()
const port = 4001
const autocompleteEndpoint = `http://localhost:${port}/autocomplete`
const esIndex = 'test'

const esClientMock = new EsClientMock()
// The purpose of this mock is to test if the query and location are
//   received by elasticsearch. And we simulate the response of elasticsearch.
//   We don't need to test the actual search result because we assume that
//   elasticsearch is working correctly.
esClientMock.add({ method: 'POST', path: `/${esIndex}/_search` }, (params: any) => {
	const q = params.body.query?.bool?.must[0]?.match_phrase_prefix?.full_addr || '';
	const location = params.body.sort?.[0]?._geo_distance?.location;
	return {
		hits: {
			total: { value: 1 },
			hits: [{
				// we return the query as the full_addr so that we can test if the query is received by elasticsearch
				_source: { full_addr: q },
				// if location is provided, we return the location as the distance so that we can test if the location is received by elasticsearch
				sort: location ? [`${location.lon},${location.lat}`] : []
			}]
		}
	}
});
const esClient = new Client({
	node: 'http://localhost:9200',
	Connection: esClientMock.getConnection()
})

const appPromise = setup({ app, esClient, port, esIndex })
	.then(() => {
		console.log(`Testing server is running on ${port}`);
	});

const BEFORE_ALL_TIMEOUT = 5000;

describe('GET /autocomplete?q=123', () => {
	let response: Response;
	let body: Array<{ [key: string]: unknown }>;

	beforeAll(async () => {
		await appPromise;
		response = await fetch(`${autocompleteEndpoint}?q=123`);
		body = await response.json();
	}, BEFORE_ALL_TIMEOUT);

	test('Should have response status 200', () => {
		expect(response.status).toBe(200);
	});

	test('Should have 1 address', () => {
		expect(body.length).toBe(1);
	})

	test('Should have full_addr as 123', () => {
		expect(body[0].full_addr).toBe('123');
	})

	test('Should not have distance', () => {
		expect(body[0].distance).toBeUndefined();
	})
})

describe('GET /autocomplete?q=300&lat=1&lon=2', () => {
	let response: Response;
	let body: Array<{ [key: string]: unknown }>;

	beforeAll(async () => {
		await appPromise;
		response = await fetch(`${autocompleteEndpoint}?q=300&lat=1&lon=2`);
		body = await response.json();
	}, BEFORE_ALL_TIMEOUT);

	test('Should have response status 200', () => {
		expect(response.status).toBe(200);
	});

	test('Should have 1 address', () => {
		expect(body.length).toBe(1);
	})

	test('Should have full_addr as 300', () => {
		expect(body[0].full_addr).toBe('300');
	})

	test('Should have distance as 2,1', () => {
		expect(body[0].distance).toBe('2,1');
	})
})

describe('GET /autocomplete?q=300&lat=1', () => {
	let response: Response;
	let body: Array<{ [key: string]: unknown }>;

	beforeAll(async () => {
		await appPromise;
		response = await fetch(`${autocompleteEndpoint}?q=300&lat=1`);
		body = await response.json();
	}, BEFORE_ALL_TIMEOUT);

	test('Should have response status 200', () => {
		expect(response.status).toBe(200);
	});

	test('Should have 1 address', () => {
		expect(body.length).toBe(1);
	})

	test('Should have full_addr as 300', () => {
		expect(body[0].full_addr).toBe('300');
	})

	test('Should not have distance', () => {
		expect(body[0].distance).toBeUndefined();
	})
})

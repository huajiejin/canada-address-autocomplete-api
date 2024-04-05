import express from 'express';
import dotenv from 'dotenv';

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

app.get("/", (req, res) => {
	res.send("OK");
});

app.listen(API_PORT, () => {
	console.log(`Canada Address Autocomplete API is running on port ${API_PORT}, http://localhost:${API_PORT}`);
});

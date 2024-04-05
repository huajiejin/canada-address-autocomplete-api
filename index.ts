import express from 'express';
import dotenv from 'dotenv';

// load .env file
dotenv.config();

const API_PORT = process.env.API_PORT || 3000;

const app = express();

app.get("/", (req, res) => {
	res.send("OK");
});

app.listen(API_PORT, () => {
	console.log(`Canada Address Autocomplete API is running on port ${API_PORT}, http://localhost:${API_PORT}`);
});

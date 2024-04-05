# Canada Address Autocomplete API

Worried about privacy and unexpected charges from Google or CanadaPost? Look no further.

This project demonstrates how to create an address autocomplete service using open data. It's developed with Node.js, Express.js, TypeScript, and Elasticsearch, sourcing data from Statistics Canada.

## Core Features

- **Rapid Response**: Deliver address suggestions within milliseconds, even with a dataset of 10 million records.
- **Geolocation Support**: Return addresses sorted by distance from the user's location.

## Why not use Google Places API or AddressComplete API by CanadaPost?

While Google Places API and AddressComplete API by CanadaPost are great services, they may not be suitable for all use cases. Here are some reasons why you might want to consider building your own service using open data:

- **Cost**: Google Places API and AddressComplete API by CanadaPost are subscription-based services. They provide a limited number of free requests per month, beyond which additional requests incur charges. For address autocomplete, the number of requests can quickly accumulate due to every user interaction with the address field triggering a request. Developing your own service using open data can help mitigate costs.
- **Privacy**: Google Places API and AddressComplete API may collect user data. If you are concerned about privacy, you may want to consider building your own service using open data.

## Getting Started

### Prerequisites

- Node.js
- Elasticsearch
- Logstash

You will first need to install Node.js on your machine, available for download [here](https://nodejs.org). Next, ensure you have Elasticsearch or access to an Elasticsearch instance; download it [here](https://www.elastic.co/downloads/elasticsearch). Finally, you will need Logstash installed on your machine, which you can download [here](https://www.elastic.co/downloads/logstash).

### Downloading the Data

The first step is to download the data. In this project, we will use the [The Open Database of Addresses (ODA)](https://www.statcan.gc.ca/en/lode/databases/oda) from Statistics Canada. The data is available in CSV format and can be downloaded from the link above. After downloading and unzipping the data, put the CSV files in the `data` directory. The structure of the `data` directory should look like this:

```text
data
├── ODA_AB_v1.csv
├── ODA_BC_v1.csv
├── ODA_MB_v1.csv
├── ODA_NB_v1.csv
├── ODA_NS_v1.csv
├── ODA_NT_v1.csv
├── ODA_ON_v1.csv
├── ODA_PE_v1.csv
├── ODA_QC_v1.csv
└── ODA_SK_v1.csv
```

### Indexing the Data

The next step is to index the data into Elasticsearch. To do this, we will use Logstash. Logstash is a tool that can ingest data from multiple sources, transform it, and send it to multiple destinations. In this project, we will use Logstash to read the CSV files and send the data to Elasticsearch.

Create a new file called `oda.conf` in the `logstash` directory with the following content:

```conf
input {
  file {
	path => "/path/to/data/*.csv"
	start_position => "beginning"
	sincedb_path => "/dev/null"
  }
}

filter {
  csv {
	separator => ","
	columns => ["latitude","longitude","source_id","id","group_id","street_no","street","str_name","str_type","str_dir","unit","city","postal_code","full_addr","city_pcs","str_name_pcs","str_type_pcs","str_dir_pcs","csduid","csdname","pruid","provider"]
  }
  mutate {
    convert => {
      "latitude" => "float"
      "longitude" => "float"
      "pruid" => "integer"
    }
    rename => {
      "latitude" => "[location][lat]"
      "longitude" => "[location][lon]"
    }
    # we only keep fields: location, city, full_addr, pruid, postal_code, "source_id","id","group_id"
    remove_field => ["latitude","longitude","street_no","street","str_name","str_type","str_dir","unit","city_pcs","str_name_pcs","str_type_pcs","str_dir_pcs","csduid","csdname","provider"]
  }
}

output {
  elasticsearch {
	; index => "canada-addresses-%{+YYYY.MM.dd}"
	index => "canada-addresses-2024.04.05"
	document_id => "%{id}"
	hosts=> "https://localhost:9200" # change to your Elasticsearch host
	user=> "elastic" # change to your Elasticsearch user
	password=> "changeme" # change to your Elasticsearch password
	cacert => "/path/to/your/ca.crt" # change to your Elasticsearch certificate
  }
}
```

Before running Logstash, you need to create an index in Elasticsearch. You can do this by sending a PUT request to the Elasticsearch using the curl command. For example:

```bash
# create an index called "canada-addresses-2024.04.05" with the mapping, you will need to change the hostname, username, password, and certificate path to match your Elasticsearch instance
curl -X PUT "https://localhost:9200/canada-addresses-2024.04.05" -H 'Content-Type: application/json' -u elastic:changeme --cacert /path/to/your/ca.crt -d '{
  "mappings": {
    "properties": {
      "location": {
        "type": "geo_point"
      },
      "city": {
        "type": "text"
      },
      "full_addr": {
        "type": "text"
      },
      "pruid": {
        "type": "integer"
      },
      "postal_code": {
        "type": "text"
      }
    }
  }
}'
```

Or you can use the Kibana Dev Tools to create the index, Go to the Kibana Dev Tools under the Management tab and run the following command:

```bash
PUT /canada-addresses-2024.04.05
{
  "mappings": {
    "properties": {
      "location": {
        "type": "geo_point"
      },
      "city": {
        "type": "text"
      },
      "full_addr": {
        "type": "text"
      },
      "pruid": {
        "type": "integer"
      },
      "postal_code": {
        "type": "text"
      }
    }
  }
}
```


After creating the index, you can run Logstash to index the data:

```bash
logstash -f logstash/oda.conf
```

The dataset includes 10 million records, so indexing the data may take some time.

### Starting the Service

After indexing the data, you can start the service. First, install the dependencies:

```bash
npm install
```

Note: You may want to change the version of the `@elastic/elasticsearch` package in `package.json` before running `npm install`. The version of the package needs to match the version of Elasticsearch instance you are using. The current version of the package is `8.13.0`, if you are using a different version of Elasticsearch, API compatibility may not be guaranteed.

Next, create a `.env` file in the root directory. You can copy from the `example.env` file and update the values as needed.

```conf
API_PORT=4000 # the port the service will run on
ES_ENDPOINT=https://localhost:9200 # the Elasticsearch endpoint
ES_CA_CERT=./ca.crt # the path to the Elasticsearch certificate
NODE_EXTRA_CA_CERTS=./ca.crt # the path to the Elasticsearch certificate
ES_USERNAME=elastic # the Elasticsearch username
ES_PASSWORD=changeme # the Elasticsearch password
ES_INDEX=canada-addresses-2024.04.05 # the Elasticsearch index you created in the previous step
```

Finally, start the service:

```bash
npm run dev
```

The service will be available at `http://localhost:4000` or the port you specified in the `.env` file.

## Using the Service

The service provides an endpoint to autocomplete addresses. You can query the service by sending a GET request to the `/autocomplete` endpoint with the query parameter `q`. For example:

```bash
curl http://localhost:4000/autocomplete?q=123%20Main%20St
```

You will receive a JSON response with the addresses that match the query.

```json
[
  {
    "full_addr": "123 MAIN ST",
    "city": "RESERVE MINES",
    "pruid": 12,
    "postal_code": null,
    "provice": "Nova Scotia",
    "provice_abbr": "NS",
    "location": {
      "lon": "-60.01856",
      "lat": "46.18440"
    }
  },
  {
    "full_addr": "123 MAIN ST",
    "city": "SPRINGHILL",
    "pruid": 12,
    "postal_code": null,
    "provice": "Nova Scotia",
    "provice_abbr": "NS",
    "location": {
      "lon": "-64.05301",
      "lat": "45.65114"
    }
  }
]
```

The `autocomplete` endpoint also supports specifying the geolocation of the user to return results closer to the user. You can pass the `lat` and `lon` query parameters to the endpoint. For example:

```bash
curl http://localhost:4000/autocomplete?q=123%20Main%20St&lat=43.65114&lon=-79.05301
```

You will receive a JSON response with the addresses that match the query and are sorted by distance from the user's location.

```json
[
  {
    "full_addr": "123 Main St",
    "city": "Markham",
    "pruid": 35,
    "postal_code": null,
    "provice": "Ontario",
    "provice_abbr": "ON",
    "location": {
      "lon": "-79.26074",
      "lat": "43.87854"
    },
    "distance": 30.29256914280844
  },
  {
    "full_addr": "123 Main St",
    "city": "Markham",
    "pruid": 35,
    "postal_code": null,
    "provice": "Ontario",
    "provice_abbr": "ON",
    "location": {
      "lon": "-79.30980",
      "lat": "43.86351"
    },
    "distance": 31.352539804009215
  },
  {
    "full_addr": "123 Main St",
    "city": "Liverpool",
    "pruid": 12,
    "postal_code": null,
    "provice": "Nova Scotia",
    "provice_abbr": "NS",
    "location": {
      "lon": "-64.71274",
      "lat": "44.03990"
    },
    "distance": 1150.830347120216
  }
]
```

Note: 

- The `distance` field is only returned when the `lat` and `lon` query parameters are provided. And the distance is in kilometers.
- The `pruid` field is the province ID. You can find the list of province IDs [here](https://www150.statcan.gc.ca/n1/pub/92-500-g/2016002/tbl/tbl_4.6-eng.htm).
- The `postal_code` field may not always be available in the dataset.

## Endpoints

The service provides the following endpoints:

### GET /autocomplete

Returns a list of addresses that match the query. You can pass the `q`, `lat`, and `lon` query parameters to the endpoint.

```bash
curl http://localhost:4000/autocomplete?q=123%20Main%20St&lat=43.65114&lon=-79.05301
```

#### Parameters

- `q` (required): The query string to search for.
- `lat` (optional): The latitude of the user's location.
- `lon` (optional): The longitude of the user's location.

#### Response

- `full_addr`: *string* The full address.
- `city`: *string* The city.
- `pruid`: *integer* The province ID.
- `postal_code`: *string* The postal code.
- `provice`: *string* The province.
- `provice_abbr`: *string* The province abbreviation.
- `location`: *object* The geolocation of the address.
- `location.lon`: *string* The longitude.
- `location.lat`: *string* The latitude.
- `distance`: *float* The distance in kilometers from the user's location (only returned when `lat` and `lon` query parameters are provided).

```json
[
  {
    "full_addr": "123 Main St",
    "city": "Markham",
    "pruid": 35,
    "postal_code": null,
    "provice": "Ontario",
    "provice_abbr": "ON",
    "location": {
      "lon": "-79.26074",
      "lat": "43.87854"
    },
    "distance": 30.29256914280844
  }
]
```

### GET /

Returns ok if the service is running. You can use this endpoint to check if the service is up and running.

```bash
curl http://localhost:4000/
```

## License

The Open Database of Addresses (ODA) is a collection of open address point data and is made available under the [Open Government License - Canada.](https://open.canada.ca/en/open-government-licence-canada)

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

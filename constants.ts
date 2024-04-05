
/**
 * A list of all the provinces and territories in Canada.
 *   Data from Statistics Canada: 
 *   https://www150.statcan.gc.ca/n1/pub/92-500-g/2016002/tbl/tbl_4.6-eng.htm
 */
export type Pruid = 10 | 11 | 12 | 13 | 24 | 35 | 46 | 47 | 48 | 59 | 60 | 61 | 62;
export const PRUID_TO_PROVINCE: Record<Pruid, string> = {
	10: "Newfoundland and Labrador",
	11: "Prince Edward Island",
	12: "Nova Scotia",
	13: "New Brunswick",
	24: "Quebec",
	35: "Ontario",
	46: "Manitoba",
	47: "Saskatchewan",
	48: "Alberta",
	59: "British Columbia",
	60: "Yukon",
	61: "Northwest Territories",
	62: "Nunavut",
};
export const PRUID_TO_PROVINCE_ABBR: Record<Pruid, string> = {
	10: "NL",
	11: "PE",
	12: "NS",
	13: "NB",
	24: "QC",
	35: "ON",
	46: "MB",
	47: "SK",
	48: "AB",
	59: "BC",
	60: "YT",
	61: "NT",
	62: "NU",
};

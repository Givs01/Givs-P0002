// Default KPI rules and district-region list (exported from kpi_rules.xlsx).
// Users can replace these in the portal by uploading their own rules workbook.
window.DEFAULT_RULES = [
  {
    "code": "1.1",
    "name": "Coverage of water supply connections",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "1.2",
    "name": "Per capita supply of water",
    "unit": "lpcd",
    "check": "No",
    "min": 0,
    "max": 250,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "1.3",
    "name": "Extent of metering of water connections",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "1.4",
    "name": "Extent of non-revenue water (NRW)",
    "unit": "%",
    "check": "Yes",
    "min": 20,
    "max": 70,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": "<20% and >70% is not allowed"
  },
  {
    "code": "1.5",
    "name": "Continuity of water supply",
    "unit": "hr/day",
    "check": "No",
    "min": 0,
    "max": 24,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "1.6",
    "name": "Quality of water supplied",
    "unit": "%",
    "check": "Yes",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1, 0",
    "blankAllowed": "No",
    "description": "0% not allowed"
  },
  {
    "code": "1.7",
    "name": "Efficiency in redressal of customer complaints",
    "unit": "%",
    "check": "Yes",
    "min": 10,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": "<10% not Allowed"
  },
  {
    "code": "1.8",
    "name": "Cost recovery in water supply services",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 250,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "1.9",
    "name": "Efficiency in collection of water supply related charges",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.1",
    "name": "Coverage of Toilets",
    "unit": "%",
    "check": "Yes",
    "min": 100,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": "If ODF then it should be 100%"
  },
  {
    "code": "2.2",
    "name": "Coverage of sewage network services",
    "unit": "%",
    "check": "No",
    "min": 10,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "",
    "blankAllowed": "No",
    "description": "No or <10% sewerage network"
  },
  {
    "code": "2.3",
    "name": "Collection efficiency of the sewage network",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.4",
    "name": "Adequacy of sewage treatment capacity",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 300,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.5",
    "name": "Quality of sewage treatment",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.6",
    "name": "Extent of reuse and recycling of sewage",
    "unit": "%",
    "check": "Yes",
    "min": 0,
    "max": 90,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ">90% not Allowed"
  },
  {
    "code": "2.7",
    "name": "Efficiency in redressal of customer complaints",
    "unit": "%",
    "check": "Yes",
    "min": 10,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": "<10% not Allowed"
  },
  {
    "code": "2.8",
    "name": "Extent of cost recovery in sewage management",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 250,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.9",
    "name": "Efficiency in collection of sewage charges",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.10",
    "name": "Coverage of storm water drainage network",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "2.11",
    "name": "Incidence of water logging/Flooding",
    "unit": "Nos.",
    "check": "No",
    "min": 0,
    "max": null,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.1",
    "name": "Household level coverage of solid waste management services",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.2",
    "name": "Efficiency of collection of municipal solid waste",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.3",
    "name": "Extent of segregation of municipal solid waste",
    "unit": "%",
    "check": "Yes",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ">100% not Allowed"
  },
  {
    "code": "3.4",
    "name": "Extent of municipal solid waste recovered",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.5",
    "name": "Extent of Scientific disposal of municipal solid waste",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.6",
    "name": "Efficiency in redressal of customer complaints",
    "unit": "%",
    "check": "Yes",
    "min": 10,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": "<10% not Allowed"
  },
  {
    "code": "3.7",
    "name": "Extent of cost recovery in SWM services",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 250,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  },
  {
    "code": "3.8",
    "name": "Efficiency in collection of SWM charges",
    "unit": "%",
    "check": "No",
    "min": 0,
    "max": 100,
    "allowed": "NA, ND",
    "notAllowed": "-, o, -1",
    "blankAllowed": "No",
    "description": ""
  }
];

window.DEFAULT_REGIONS = [
  {
    "district": "Ahmedabad",
    "region": "Ahmedabad"
  },
  {
    "district": "Bharuch",
    "region": "Surat"
  },
  {
    "district": "Amreli",
    "region": "Bhavnagar"
  },
  {
    "district": "Anand",
    "region": "Vadodara"
  },
  {
    "district": "Kachchh",
    "region": "Rajkot"
  },
  {
    "district": "Mahi Sagar",
    "region": "Vadodara"
  },
  {
    "district": "Junagadh",
    "region": "Bhavnagar"
  },
  {
    "district": "Botad",
    "region": "Ahmedabad"
  },
  {
    "district": "Surat",
    "region": "Surat"
  },
  {
    "district": "Aravalli",
    "region": "Gandhinagar"
  },
  {
    "district": "Banaskantha",
    "region": "Gandhinagar"
  },
  {
    "district": "Dwarka",
    "region": "Rajkot"
  },
  {
    "district": "Bhavnagar",
    "region": "Bhavnagar"
  },
  {
    "district": "Rajkot",
    "region": "Rajkot"
  },
  {
    "district": "Navsari",
    "region": "Surat"
  },
  {
    "district": "Kheda",
    "region": "Ahmedabad"
  },
  {
    "district": "Patan",
    "region": "Gandhinagar"
  },
  {
    "district": "Chhota Udepur",
    "region": "Vadodara"
  },
  {
    "district": "Surendranagar",
    "region": "Ahmedabad"
  },
  {
    "district": "Vadodara",
    "region": "Vadodara"
  },
  {
    "district": "Dahod",
    "region": "Vadodara"
  },
  {
    "district": "Gandhinagar",
    "region": "Gandhinagar"
  },
  {
    "district": "Valsad",
    "region": "Surat"
  },
  {
    "district": "Jamnagar",
    "region": "Rajkot"
  },
  {
    "district": "Panchmahal",
    "region": "Vadodara"
  },
  {
    "district": "Morbi",
    "region": "Rajkot"
  },
  {
    "district": "Sabarkantha",
    "region": "Gandhinagar"
  },
  {
    "district": "Mehasana",
    "region": "Gandhinagar"
  },
  {
    "district": "Gir Somnath",
    "region": "Bhavnagar"
  },
  {
    "district": "Porbandar",
    "region": "Rajkot"
  },
  {
    "district": "Narmada",
    "region": "Surat"
  },
  {
    "district": "Tapi",
    "region": "Surat"
  },
  {
    "district": "Kutch",
    "region": "Rajkot"
  }
];

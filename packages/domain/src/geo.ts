/**
 * City directory for structured intake: city -> state + common localities.
 * Powers the themed combobox suggestions. Free text always allowed.
 */
export interface CityInfo {
  readonly city: string;
  readonly state: string;
  readonly localities: ReadonlyArray<string>;
}

export const CITY_DIRECTORY: ReadonlyArray<CityInfo> = [
  { city: "Bengaluru", state: "Karnataka", localities: ["HSR Layout", "Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "Malleshwaram", "Yelahanka", "Electronic City", "BTM Layout", "Hebbal"] },
  { city: "Mumbai", state: "Maharashtra", localities: ["Andheri West", "Bandra", "Dadar", "Powai", "Worli", "Borivali", "Chembur", "Malad"] },
  { city: "Delhi", state: "Delhi", localities: ["Lajpat Nagar", "Rohini", "Dwarka", "Saket", "Karol Bagh", "Pitampura", "Vasant Kunj"] },
  { city: "Pune", state: "Maharashtra", localities: ["Kothrud", "Baner", "Viman Nagar", "Hadapsar", "Aundh", "Kharadi"] },
  { city: "Hyderabad", state: "Telangana", localities: ["Gachibowli", "Madhapur", "Kukatpally", "Banjara Hills", "Secunderabad"] },
  { city: "Chennai", state: "Tamil Nadu", localities: ["T. Nagar", "Adyar", "Velachery", "Anna Nagar", "OMR"] },
  { city: "Kolkata", state: "West Bengal", localities: ["Salt Lake", "Behala", "Ballygunge", "Dum Dum"] },
  { city: "Jaipur", state: "Rajasthan", localities: ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar"] },
  { city: "Gurugram", state: "Haryana", localities: ["Sector 45", "DLF Phase 2", "Sohna Road", "Golf Course Road"] },
  { city: "Gurgaon", state: "Haryana", localities: ["Sector 45", "DLF Phase 2", "Sohna Road"] },
  { city: "Noida", state: "Uttar Pradesh", localities: ["Sector 62", "Sector 18", "Sector 150"] },
  { city: "Ahmedabad", state: "Gujarat", localities: ["Satellite", "Maninagar", "Bopal"] },
  { city: "Lucknow", state: "Uttar Pradesh", localities: ["Gomti Nagar", "Alambagh", "Hazratganj"] },
  { city: "Kochi", state: "Kerala", localities: ["Kakkanad", "Fort Kochi", "Edappally"] },
  { city: "Chandigarh", state: "Chandigarh", localities: ["Sector 17", "Sector 35", "Manimajra"] },
  { city: "Bhopal", state: "Madhya Pradesh", localities: ["MP Nagar", "Arera Colony"] },
];

export const cityOptions = (): ReadonlyArray<{ value: string; hint: string }> =>
  CITY_DIRECTORY.map((c) => ({ value: c.city, hint: c.state }));

export const stateForCity = (city: string): string | undefined =>
  CITY_DIRECTORY.find((c) => c.city.toLowerCase() === city.trim().toLowerCase())?.state;

export const localitiesForCity = (city: string): ReadonlyArray<string> =>
  CITY_DIRECTORY.find((c) => c.city.toLowerCase() === city.trim().toLowerCase())?.localities ?? [];


export interface CountryOption {
  value: string; // ISO2 code
  label: string; // Full country name
}

export const countries: CountryOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "RU", label: "Russia" },
  { value: "ZA", label: "South Africa" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SG", label: "Singapore" },
  { value: "KR", label: "South Korea" },
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
  { value: "TH", label: "Thailand" },
  { value: "NZ", label: "New Zealand" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "PE", label: "Peru" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "CH", label: "Switzerland" },
  { value: "IL", label: "Israel" },
  { value: "IE", label: "Ireland" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "GR", label: "Greece" },
  { value: "TR", label: "Turkey" },
  { value: "EG", label: "Egypt" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "MA", label: "Morocco" },
];

// Helper function to find country by ISO2 code
export const getCountryByCode = (code: string): CountryOption | undefined => {
  return countries.find(country => country.value === code);
};

// Helper function to find country by name
export const getCountryByName = (name: string): CountryOption | undefined => {
  return countries.find(country => country.label.toLowerCase() === name.toLowerCase());
}; 
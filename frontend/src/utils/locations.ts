// Common Indonesian locations (Jimbaran Hijau project area focus)
// This is a curated list combined with option for custom entry

export const COMMON_LOCATIONS = [
  // Bali & Indonesia Focus
  "Jimbaran, Bali, Indonesia",
  "Denpasar, Bali, Indonesia",
  "Ubud, Bali, Indonesia",
  "Sanur, Bali, Indonesia",
  "Kuta, Bali, Indonesia",
  "Seminyak, Bali, Indonesia",
  "Canggu, Bali, Indonesia",
  "Gianyar, Bali, Indonesia",
  "Bangli, Bali, Indonesia",
  "Buleleng, Bali, Indonesia",
  "Karangasem, Bali, Indonesia",
  "Klungkung, Bali, Indonesia",
  "Tabanan, Bali, Indonesia",
  
  // Major Indonesian Cities
  "Jakarta, Indonesia",
  "Surabaya, Indonesia",
  "Bandung, Indonesia",
  "Medan, Indonesia",
  "Semarang, Indonesia",
  "Makassar, Indonesia",
  "Palembang, Indonesia",
  "Yogyakarta, Indonesia",
  "Pontianak, Indonesia",
  "Banjarmasin, Indonesia",
  
  // Other Popular Locations
  "Singapore",
  "Kuala Lumpur, Malaysia",
  "Bangkok, Thailand",
  "Manila, Philippines",
  "Ho Chi Minh City, Vietnam",
  "Hanoi, Vietnam",
  "Hong Kong",
  "Shanghai, China",
  "Tokyo, Japan",
  "Sydney, Australia",
];

export interface LocationOption {
  label: string;
  value: string;
}

// Get list of locations for dropdown
export const getLocationOptions = (): LocationOption[] => {
  return COMMON_LOCATIONS.map(location => ({
    label: location,
    value: location
  }));
};

// Filter locations based on search input
export const filterLocations = (searchQuery: string): LocationOption[] => {
  if (!searchQuery.trim()) {
    return getLocationOptions();
  }

  const query = searchQuery.toLowerCase();
  return getLocationOptions().filter(option =>
    option.label.toLowerCase().includes(query)
  );
};

// Validate if input is a valid location (either from list or custom)
export const isValidLocation = (location: string): boolean => {
  return location.trim().length > 0;
};

// Get location suggestions for autocomplete
export const getLocationSuggestions = (input: string, limit: number = 10): LocationOption[] => {
  const filtered = filterLocations(input);
  return filtered.slice(0, limit);
};

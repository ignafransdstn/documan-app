# Location Autocomplete Feature

## Overview
Location field sekarang dilengkapi dengan autocomplete dropdown yang memudahkan user memilih lokasi dari daftar pre-defined atau mengetik lokasi custom.

## Implementation Details

### Files Created:
1. **`frontend/src/utils/locations.ts`**
   - Contains list of 30+ common locations (focus pada Bali & Indonesia)
   - Functions untuk filtering dan suggestions
   - Exported interfaces untuk type safety

2. **`frontend/src/hooks/useLocationAutocomplete.ts`**
   - Custom React hook untuk autocomplete logic
   - Keyboard navigation support (Arrow Up/Down, Enter, Escape)
   - Click outside detection untuk close dropdown
   - Returns input state, suggestions, dan handlers

3. **`frontend/src/components/LocationInput.tsx`**
   - Reusable component untuk location input field
   - Accepts props: value, onChange, label, placeholder, required, disabled
   - Displays dropdown dengan suggestions
   - Support keyboard navigation

4. **`frontend/src/components/LocationInput.module.css`**
   - Styling untuk LocationInput component
   - Responsive design dengan hover effects
   - Custom scrollbar styling

### Files Modified:
1. **`frontend/src/pages/DocumentsPage.tsx`**
   - Imported LocationInput component
   - Replaced text input dengan LocationInput di upload form (line ~693)
   - Replaced text input dengan LocationInput di edit modal (line ~1168)

2. **`frontend/src/i18n/en.json`**
   - Added: `forms.locationPlaceholder: "Type or select location..."`

3. **`frontend/src/i18n/id.json`**
   - Added: `forms.locationPlaceholder: "Ketik atau pilih lokasi..."`

## Features:
✅ Predefined list dari 30+ lokasi (Bali, Jakarta, Surabaya, dll)
✅ Real-time filtering saat user mengetik
✅ Keyboard navigation (arrow keys, enter, escape)
✅ Custom location support (user bisa mengetik lokasi apapun)
✅ Click outside untuk close dropdown
✅ Responsive design
✅ i18n support (EN & ID)
✅ Type-safe implementation

## Usage:
```tsx
<LocationInput
  value={location}
  onChange={setLocation}
  label="Location"
  placeholder="Type or select location..."
  required={true}
/>
```

## Location List (COMMON_LOCATIONS):
- Jimbaran, Bali, Indonesia
- Denpasar, Bali, Indonesia
- Ubud, Bali, Indonesia
- ... dan 27 lokasi lainnya
- Plus major Indonesian cities dan beberapa kota internasional

## Database Integration:
- Location value disimpan sebagai string di database (sama seperti sebelumnya)
- Backend tidak perlu perubahan karena tetap receive location sebagai string
- Dapat di-update dan di-retrieve tanpa modifikasi API

## Future Enhancements:
1. Tambah lebih banyak lokasi ke COMMON_LOCATIONS
2. Load locations dari API/database untuk dynamic list
3. Add geolocation feature (detect user's current location)
4. Integrate dengan Google Maps atau OpenStreetMap API untuk full location database

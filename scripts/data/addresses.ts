/**
 * Realistic Indian Addresses
 * Address data with postal codes for realistic customer profiles
 */

export interface Address {
  city: string;
  state: string;
  postalCode: string;
  area: string;
  country: string;
}

export const cityData: Record<string, { state: string; postalCodes: string[]; areas: string[] }> = {
  Mumbai: {
    state: 'Maharashtra',
    postalCodes: ['400001', '400052', '400070', '400092', '400101'],
    areas: ['Andheri', 'Bandra', 'Powai', 'Juhu', 'Worli', 'Colaba', 'Kurla', 'Borivali'],
  },
  Delhi: {
    state: 'Delhi',
    postalCodes: ['110001', '110016', '110024', '110029', '110092'],
    areas: ['Connaught Place', 'Saket', 'Dwarka', 'Rohini', 'Pitampura', 'Karol Bagh', 'Lajpat Nagar'],
  },
  Bangalore: {
    state: 'Karnataka',
    postalCodes: ['560001', '560034', '560038', '560095', '560102'],
    areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'HSR Layout', 'Marathahalli', 'BTM Layout'],
  },
  Hyderabad: {
    state: 'Telangana',
    postalCodes: ['500001', '500032', '500081', '500084', '500090'],
    areas: ['Hitech City', 'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Secunderabad', 'Kondapur'],
  },
  Chennai: {
    state: 'Tamil Nadu',
    postalCodes: ['600001', '600028', '600034', '600089', '600096'],
    areas: ['T Nagar', 'Anna Nagar', 'Adyar', 'OMR', 'Velachery', 'Porur', 'Guindy'],
  },
  Kolkata: {
    state: 'West Bengal',
    postalCodes: ['700001', '700019', '700029', '700091', '700104'],
    areas: ['Park Street', 'Salt Lake', 'New Town', 'Howrah', 'Dum Dum', 'Ballygunge'],
  },
  Pune: {
    state: 'Maharashtra',
    postalCodes: ['411001', '411014', '411028', '411057', '411061'],
    areas: ['Koregaon Park', 'Hinjewadi', 'Viman Nagar', 'Baner', 'Aundh', 'Wakad'],
  },
  Ahmedabad: {
    state: 'Gujarat',
    postalCodes: ['380001', '380009', '380015', '380052', '380061'],
    areas: ['Navrangpura', 'Satellite', 'Bopal', 'Vastrapur', 'Maninagar', 'Paldi'],
  },
  Jaipur: {
    state: 'Rajasthan',
    postalCodes: ['302001', '302017', '302022', '302033', '302041'],
    areas: ['Malviya Nagar', 'Vaishali Nagar', 'C Scheme', 'Raja Park', 'Mansarovar', 'Tonk Road'],
  },
  Surat: {
    state: 'Gujarat',
    postalCodes: ['395001', '395003', '395007', '395009', '395010'],
    areas: ['Adajan', 'Vesu', 'Athwa', 'Varachha', 'Katargam', 'Udhna'],
  },
};

export function getRandomAddress(city?: string): Address {
  const cities = Object.keys(cityData);
  const selectedCity = city || cities[Math.floor(Math.random() * cities.length)];
  const data = cityData[selectedCity];
  
  if (!data) {
    throw new Error(`Unknown city: ${selectedCity}`);
  }
  
  const postalCode = data.postalCodes[Math.floor(Math.random() * data.postalCodes.length)];
  const area = data.areas[Math.floor(Math.random() * data.areas.length)];
  
  return {
    city: selectedCity,
    state: data.state,
    postalCode,
    area,
    country: 'India',
  };
}

export function getAddressByCity(city: string): Address {
  return getRandomAddress(city);
}


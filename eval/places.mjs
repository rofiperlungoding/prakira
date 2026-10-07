// Fixed locations and household profiles shared by the evaluation scripts.
export const SETS = {
  // The prompt and the verifier were tuned while looking at results from these 20 places.
  tuned: [
    ['Jakarta', -6.2, 106.8], ['Surabaya', -7.25, 112.75], ['Bandung', -6.92, 107.61], ['Medan', 3.59, 98.67], ['Makassar', -5.15, 119.43],
    ['Delhi', 28.61, 77.21], ['Dhaka', 23.81, 90.41], ['Bangkok', 13.76, 100.5], ['Manila', 14.6, 120.98], ['Lagos', 6.52, 3.38],
    ['Cairo', 30.04, 31.24], ['Dubai', 25.2, 55.27], ['Phoenix', 33.45, -112.07], ['Houston', 29.76, -95.37], ['Sao Paulo', -23.55, -46.63],
    ['London', 51.51, -0.13], ['Madrid', 40.42, -3.7], ['Beijing', 39.9, 116.4], ['Sydney', -33.87, 151.21], ['Nairobi', -1.29, 36.82],
  ],
  // Never used while tuning. Do not change the prompt or the verifier in response to results from this set.
  heldout: [
    ['Karachi', 24.86, 67.01], ['Mumbai', 19.08, 72.88], ['Ho Chi Minh City', 10.82, 106.63], ['Kuala Lumpur', 3.14, 101.69], ['Riyadh', 24.71, 46.68],
    ['Mexico City', 19.43, -99.13], ['Johannesburg', -26.2, 28.05], ['Tokyo', 35.68, 139.69], ['Paris', 48.86, 2.35], ['Toronto', 43.65, -79.38],
    ['Semarang', -6.97, 110.42], ['Chennai', 13.08, 80.27], ['Accra', 5.6, -0.19], ['Lima', -12.05, -77.04], ['Las Vegas', 36.17, -115.14],
  ],
};
export const PROFILES = [[], ['older_adult', 'no_air_conditioning'], ['outdoor_worker'], ['young_child', 'respiratory_condition']];

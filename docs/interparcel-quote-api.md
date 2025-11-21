# Interparcel Quote API Documentation

## Get a parcel delivery quote
Obtain a parcel delivery quote from a collection address to a delivery address, optionally filtered by carrier, service or type.

### Endpoint
```
POST https://api.interparcel.com/quote
```

### Request Body Structure
- **collection** (required)
  - city (string)
  - state (string, optional)
  - postcode (string, required)
  - country (string, required)

- **delivery** (required)
  - city (string)
  - state (string, optional)
  - postcode (string, required)
  - country (string, required)

- **parcels** (required array)
  - weight (number, in kg)
  - length (number, in cm)
  - width (number, in cm)
  - height (number, in cm)

- **filter** (optional)
  - serviceLevel (array): ["standard", "express", "timed", "sameday", "pallet"]
  - carriers (array): Carrier codes
  - services (array): Service codes
  - pickupType (array): ["collection", "dropoff"]

### Example Request - Minimum
```json
{
  "collection": {
    "city": "Geelong",
    "postcode": "3220",
    "country": "Australia"
  },
  "delivery": {
    "city": "Melbourne",
    "postcode": "3000",
    "country": "Australia"
  },
  "parcels": [
    {
      "weight": 2,
      "length": 30,
      "width": 20,
      "height": 15
    }
  ]
}
```

### Example Response
```json
{
  "status": 0,
  "services": [
    {
      "id": "AUSPOST_STANDARD",
      "carrier": "Australia Post",
      "name": "Standard",
      "service": "Australia Post Standard",
      "serviceLevel": "standard",
      "price": 12.50,
      "currency": "AUD",
      "taxable": true,
      "includedCover": 100,
      "maxCover": 5000,
      "printerNeeded": false,
      "restrictions": {
        "maximumWeight": 22,
        "maximumLength": 105
      },
      "pickupType": "dropoff",
      "delivery": {
        "daysFrom": 2,
        "daysTo": 5
      }
    }
  ]
}
```

### Error Response
```json
{
  "status": 1,
  "errorMessage": "Invalid collection country",
  "errorCode": "100001"
}
```

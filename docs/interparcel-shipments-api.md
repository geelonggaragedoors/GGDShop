# Interparcel Shipments API Documentation

## Add a shipment
Add a shipment to the Shipping Manager, where it can then be manually edited and booked.

### Endpoint
```
POST https://api.interparcel.com/shipments/add
```

### Request Headers
- Authorization: Bearer {API_KEY}
- Content-Type: application/json

### Request Body Structure
- **validate** (boolean): Whether to validate the shipment
- **reference** (string): Your reference number
- **collection** (required)
  - name (string)
  - company (string, optional)
  - add1 (string): Address line 1
  - add2 (string, optional): Address line 2
  - city (string)
  - state (string, optional)
  - postcode (string)
  - country (string)
  - telephone (string)
  - email (string)

- **delivery** (required)
  - name (string)
  - company (string, optional)
  - add1 (string): Address line 1
  - add2 (string, optional): Address line 2
  - city (string)
  - state (string, optional)
  - postcode (string)
  - country (string)
  - telephone (string)
  - email (string)

- **parcels** (required array)
  - weight (number, in kg)
  - length (number, in cm)
  - width (number, in cm)
  - height (number, in cm)

- **contents** (string): Description of contents
- **value** (number): Value of shipment
- **service** (string): Service code from quote
- **pickup** (optional)
  - date (string): YYYY-MM-DD
  - earliest (string): HH:MM
  - latest (string): HH:MM
- **transitCover** (boolean): Whether to include transit cover

### Example Request
```json
{
  "validate": true,
  "reference": "GGD-ORDER-12345",
  "collection": {
    "name": "Geelong Garage Doors",
    "company": "Geelong Garage Doors",
    "add1": "123 Business Street",
    "add2": "",
    "city": "Geelong",
    "state": "VIC",
    "postcode": "3220",
    "country": "AU",
    "telephone": "+61352219222",
    "email": "orders@geelonggaragedoors.com.au"
  },
  "delivery": {
    "name": "John Smith",
    "company": "",
    "add1": "456 Residential Ave",
    "add2": "",
    "city": "Melbourne",
    "state": "VIC",
    "postcode": "3000",
    "country": "AU",
    "telephone": "+61400123456",
    "email": "john.smith@email.com"
  },
  "parcels": [
    {
      "weight": 5,
      "length": 50,
      "width": 30,
      "height": 20
    }
  ],
  "contents": "Garage door parts and accessories",
  "value": 150,
  "service": "Australia Post Standard",
  "pickup": {
    "date": "2024-01-15",
    "earliest": "09:00",
    "latest": "17:00"
  },
  "transitCover": true
}
```

### Example Response - Success
```json
{
  "status": 0,
  "shipmentId": "SH123456789",
  "trackingNumber": "AU987654321",
  "message": "Shipment added successfully"
}
```

### Example Response - Error
```json
{
  "status": 1,
  "errorMessage": "Invalid delivery postcode",
  "errorCode": "100002"
}
```

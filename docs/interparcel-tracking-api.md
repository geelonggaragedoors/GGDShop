# Interparcel Tracking API Documentation

## Track a parcel
Track your shipments with your 12 digit Interparcel tracking number.

### Endpoint
```
GET https://api.interparcel.com/tracking/{trackingNumber}
```

### Request Headers
- Authorization: Bearer {API_KEY}

### Request Parameters
- trackingNumber: 12 digit Interparcel tracking number (e.g., GB9999999999)

### Example Request
```
GET https://api.interparcel.com/tracking/GB9999999999
```

### Example Response - Success
```json
{
  "status": 0,
  "service": "FedEx Economy",
  "currentStatus": "D",
  "dateSent": "2023-11-07",
  "dateDelivered": "2023-11-09",
  "timeDelivered": "16:10",
  "signedForName": "A.N. Example",
  "events": [
    {
      "date": "2023-11-09",
      "time": "16:10",
      "event": "Delivered",
      "location": "Rome, IT",
      "status": "D"
    },
    {
      "date": "2023-11-09",
      "time": "13:26",
      "event": "On FedEx vehicle for delivery",
      "location": "Rome, IT",
      "status": "O"
    },
    {
      "date": "2023-11-08",
      "time": "23:19",
      "event": "In transit",
      "location": "Stanstead, UK",
      "status": "T"
    },
    {
      "date": "2023-11-07",
      "time": "09:05",
      "event": "Shipment has been booked",
      "location": "Online",
      "status": "B"
    }
  ]
}
```

### Example Response - Error
```json
{
  "status": 1,
  "errorCode": 1,
  "errorMessage": "The tracking number is not valid"
}
```

### Status Codes
- B: Booked
- T: In Transit
- O: Out for Delivery
- D: Delivered

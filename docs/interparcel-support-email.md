# Email to Interparcel Support

**Subject:** API Integration Support Required - Authentication Issues with API Key gZouPfGRNbipC55V024a

---

**Email Content:**

Dear Interparcel Support Team,

I hope this email finds you well. I am writing to request assistance with integrating the Interparcel API into our e-commerce platform for Geelong Garage Doors.

## **Account Details:**
- **Company:** Geelong Garage Doors
- **API Key:** gZouPfGRNbipC55V024a (confirmed active by your team)
- **Integration Purpose:** Automated shipping cost calculations for garage door parts and accessories

## **Current Issue:**
We are experiencing authentication problems when attempting to connect to your API. Despite having a confirmed active API key, all our requests are returning authentication errors.

## **Technical Details:**

### **Endpoints Tested:**
- `https://api.interparcel.com/quote` → Returns "Missing API version" (404)
- `https://api.interparcel.com/v1/quote` → Returns "Unauthorized" (401)
- `https://api.interparcel.com/v2/quote` → Returns "Unauthorized" (401)

### **Authentication Methods Attempted:**
- `Authorization: Bearer gZouPfGRNbipC55V024a`
- `X-API-Key: gZouPfGRNbipC55V024a`
- `API-Key: gZouPfGRNbipC55V024a`
- Various other header formats

All methods result in 401 Unauthorized errors.

### **Sample Request:**
```json
POST /quote
Content-Type: application/json
Authorization: Bearer gZouPfGRNbipC55V024a

{
  "collection": {
    "city": "Geelong",
    "state": "VIC",
    "postcode": "3220",
    "country": "AU"
  },
  "delivery": {
    "city": "Melbourne",
    "state": "VIC",
    "postcode": "3000",
    "country": "AU"
  },
  "parcels": [{
    "weight": 2,
    "length": 30,
    "width": 20,
    "height": 15
  }]
}
```

## **Information Required:**

1. **Correct API Endpoint URL:** What is the exact base URL and path for the quote API?

2. **Authentication Header Format:** What is the correct header name and format for passing the API key?

3. **API Version:** Which API version should we be using?

4. **Account Setup:** Are there any additional setup steps required before the API key becomes functional?

5. **Test Environment:** Do you provide a sandbox/test environment for development?

6. **Rate Limits:** What are the rate limiting policies we should be aware of?

7. **Documentation:** Could you provide the most current API documentation with working examples?

## **Use Case:**
We will be integrating the API to provide real-time shipping quotes for:
- Small parts (remotes, hinges): 0.2-2kg
- Medium components (motor parts): 2-15kg  
- Large items (door panels, motors): 15-25kg
- Multiple parcel shipments
- Deliveries across Australia (metro and regional areas)

## **Development Environment:**
- **Platform:** Node.js/JavaScript
- **Framework:** Express.js backend with React frontend
- **Location:** Geelong, VIC 3220 (collection address)

## **Urgency:**
We have a complete test suite ready and are eager to complete this integration. Any guidance you can provide would be greatly appreciated.

Please let me know if you need any additional information or if there's a better time to discuss this via phone at (02) 8373 9108.

Thank you for your time and assistance.

**Best regards,**

[Your Name]  
[Your Title]  
Geelong Garage Doors  
[Your Phone Number]  
[Your Email Address]

---

**Attachments to Consider:**
- Screenshot of the 401 error response
- Sample request/response logs
- Your current test code (if helpful)

---

**Follow-up Actions:**
- [ ] Send email to Interparcel support
- [ ] Wait for response with correct authentication details  
- [ ] Test the provided authentication method
- [ ] Run comprehensive shipping calculation tests
- [ ] Implement in production e-commerce system

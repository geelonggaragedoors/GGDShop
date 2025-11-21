# Email to Interparcel Support - IP Allowlist Request

**Subject:** URGENT: IP Allowlist Update Required for API Key gZouPfGRNbipC55V024a

---

**Email Content:**

Dear Interparcel Support Team,

I have identified the issue with our API authentication problems. Our current IP address is not included in the allowed IP list for our API key.

## **Account Details:**
- **Company:** Geelong Garage Doors
- **API Key:** gZouPfGRNbipC55V024a
- **Current Allowed IP:** 104.21.10.218
- **Our Current IP:** 103.55.79.106

## **Issue Identified:**
The 401 Unauthorized errors we've been experiencing are due to IP address restrictions. Our development and production servers are running from IP `103.55.79.106`, which is not in the current allowlist.

## **Request:**
Please add the following IP address to our API key allowlist:
- **IP to Add:** `103.55.79.106`

## **Additional Considerations:**
Given that we're a business with potentially dynamic IP addresses, could you please advise on:

1. **Multiple IP Support:** Can we have multiple IP addresses whitelisted for our account?

2. **Dynamic IP Solution:** Do you offer any solutions for businesses with changing IP addresses?

3. **Production vs Development:** Should we have separate API keys for development and production environments?

4. **IP Range Support:** Do you support IP ranges or CIDR notation for allowlisting?

## **Business Context:**
We are integrating the Interparcel API into our e-commerce platform for automated shipping calculations. We have:
- Development environment (current IP: 103.55.79.106)
- Production environment (may have different IP)
- Potential for IP changes due to ISP or hosting provider updates

## **Urgency:**
We have a complete integration ready to deploy and are waiting only on this IP allowlist update to proceed with testing and implementation.

## **Technical Confirmation:**
Once the IP is added, we will test the following endpoints:
- `POST https://api.interparcel.com/v1/quote`
- Authentication: `Authorization: Bearer gZouPfGRNbipC55V024a`
- Rate limit compliance: Maximum 5 requests per minute

Please confirm:
1. When the IP update will be completed
2. The correct API endpoint URL and authentication method
3. Any additional setup requirements

Thank you for your prompt assistance with this matter.

**Best regards,**

[Your Name]  
[Your Title]  
Geelong Garage Doors  
[Your Phone Number]  
[Your Email Address]

---

**Follow-up Actions After IP Update:**
- [ ] Test API connection immediately after IP is added
- [ ] Run comprehensive shipping calculation tests
- [ ] Implement rate limiting in production code
- [ ] Deploy shipping integration to e-commerce platform

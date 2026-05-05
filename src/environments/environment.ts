export const environment = {
  production: false,
  apiUrls: {
    auth:         'https://medibook-auth-d5gdajevhvh0hbhw.centralindia-01.azurewebsites.net/api/v1',
    provider:     'https://medibook-provider-bnf5eze6h2eza2at.centralindia-01.azurewebsites.net/api/v1',
    schedule:     'https://medibook-schedule-hsh7asfwcybrbvb7.centralindia-01.azurewebsites.net/api/v1',
    payment:      'https://medibook-payment-bvf7d8drcfdpehc8.centralindia-01.azurewebsites.net/api/v1',
    appointment:  'https://medibook-appointment-fucuajhaacbhh3h5.centralindia-01.azurewebsites.net/api/v1',
    notification: 'https://medibook-notification-eka7fufwa4esahcc.centralindia-01.azurewebsites.net/api/v1',
    review:       'https://medibook-review-b3fhbfb4asa7dua4.centralindia-01.azurewebsites.net/api/v1',
  },
  razorpay: {
    keyId: 'rzp_test_SgUerX75wnUFKA',   // Replace with your Razorpay key
    name:  'MediBook',
    description: 'Medical Appointment Payment',
    theme: { color: '#00a896' }
  },
  polling: {
    paymentIntervalMs: 2000,
    paymentMaxAttempts: 30,
  }
};

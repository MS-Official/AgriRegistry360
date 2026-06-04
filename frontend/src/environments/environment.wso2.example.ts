// Environment template for routing requests through WSO2 API Manager Gateway
export const environment = {
  apiUrl: 'https://localhost:8243/agriregistry360/registry/1.0.0', // WSO2 Gateway proxy context
  useWso2Gateway: true,
  localApiUrl: 'http://localhost:5001/api', // Direct backend local URL
};

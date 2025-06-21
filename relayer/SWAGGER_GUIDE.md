# 📚 Swagger API Documentation Guide

## 🌐 Accessing the API Documentation

Once your Miko Relayer server is running, you can access the interactive API documentation at:

**🔗 http://localhost:3000/api-docs**

## 🎯 Features

### ✅ **Interactive API Testing**
- Test all endpoints directly from the browser
- Pre-filled example requests
- Real-time response viewing
- Request/response validation

### ✅ **Comprehensive Documentation**
- Detailed endpoint descriptions
- Request/response schemas
- Example payloads
- Error handling documentation

### ✅ **Common Token Examples**
- Pre-configured examples for popular tokens
- SOL ↔ USDC swap examples
- Different slippage tolerance examples

## 🚀 How to Use the Swagger UI

### 1. **Open the Documentation**
```
http://localhost:3000/api-docs
```

### 2. **Explore Endpoints**
- **Health**: `/health` - Check server status
- **Swap**: `/api/swap` - Initialize token swaps
- **Confirm**: `/api/confirm` - Execute swaps

### 3. **Test the `/api/swap` Endpoint**

1. **Click on the `/api/swap` endpoint**
2. **Click "Try it out"**
3. **Use the example payload or customize:**

```json
{
  "fromToken": "So11111111111111111111111111111111111111112",
  "toToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "100000000",
  "destinationWallet": "YourWalletAddressHere",
  "slippageBps": 50
}
```

4. **Click "Execute"**
5. **View the response with temporary wallet details**

### 4. **Test the `/api/confirm` Endpoint**

1. **Use the response from `/api/swap`**
2. **Click on the `/api/confirm` endpoint**
3. **Click "Try it out"**
4. **Fill in the request body:**

```json
{
  "tempWalletAddress": "TempWalletFromSwapResponse",
  "confirmation": false,
  "destinationWallet": "YourWalletAddressHere",
  "quoteResponse": { /* Quote from swap response */ }
}
```

5. **Set `confirmation: false` for testing (won't execute)**
6. **Click "Execute"**

## 🔧 Pre-configured Examples

### **SOL to USDC Swap (0.1 SOL)**
```json
{
  "fromToken": "So11111111111111111111111111111111111111112",
  "toToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "100000000",
  "destinationWallet": "YourWalletAddressHere",
  "slippageBps": 50
}
```

### **USDC to SOL Swap (10 USDC)**
```json
{
  "fromToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "toToken": "So11111111111111111111111111111111111111112",
  "amount": "10000000",
  "destinationWallet": "YourWalletAddressHere",
  "slippageBps": 100
}
```

## 📊 Understanding Responses

### **Successful Swap Quote Response**
```json
{
  "success": true,
  "data": {
    "tempWalletAddress": "Generated wallet address",
    "destinationWallet": "Your wallet address",
    "swap": {
      "fromToken": "Source token mint",
      "toToken": "Destination token mint",
      "inputAmount": 100000000,
      "expectedOutputAmount": 999500000,
      "slippageBps": 50,
      "priceImpactPct": 0.01
    },
    "quote": { /* Jupiter quote data */ },
    "instructions": [
      "Step-by-step instructions",
      "For completing the swap"
    ],
    "expiresAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "fromToken is required and must be a string"
  ]
}
```

## 🔍 Testing Tips

### **✅ Safe Testing**
- Always use `confirmation: false` when testing
- Use small amounts for initial tests
- Replace `"YourWalletAddressHere"` with actual wallet addresses
- Test with devnet tokens first if possible

### **✅ Common Issues**
- **Invalid token addresses**: Use proper mint addresses
- **Amount format**: Use string format for large numbers
- **Wallet addresses**: Ensure valid Solana addresses
- **Network issues**: Check Jupiter API availability

## 🛠️ Development Features

### **Schema Validation**
- Real-time validation of request payloads
- Detailed error messages for invalid data
- Type checking and format validation

### **Response Examples**
- Multiple response examples for different scenarios
- Success, error, and edge case responses
- Explorer links for transactions

### **Interactive Features**
- Collapsible sections
- Syntax highlighting
- Copy-paste functionality
- Export capabilities

## 📱 Mobile-Friendly

The Swagger UI is responsive and works well on:
- Desktop browsers
- Mobile devices
- Tablets
- Development environments

## 🚨 Security Notes

- **Don't use real wallet addresses** in public documentation
- **Test with small amounts** first
- **Use devnet for development** when possible
- **Monitor server logs** for debugging

## 🔗 Quick Links

| Link | Description |
|------|-------------|
| [API Docs](http://localhost:3000/api-docs) | Interactive API documentation |
| [Health Check](http://localhost:3000/health) | Server health status |
| [Swap Endpoint](http://localhost:3000/api-docs#/Swap/post_api_swap) | Direct link to swap docs |
| [Confirm Endpoint](http://localhost:3000/api-docs#/Swap/post_api_confirm) | Direct link to confirm docs |

## 💡 Next Steps

1. **Explore the interactive documentation**
2. **Test with safe parameters**
3. **Read the detailed descriptions**
4. **Try different token combinations**
5. **Check response formats**
6. **Integrate with your application**

Happy testing! 🎉 
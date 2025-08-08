## Testing with the Correct API Configuration

When testing the system, make sure to:

1. **Set the Correct API Key**

   - Use your actual Together.ai API key in the `.env` file
   - Don't include any of the placeholder keys for individual models

2. **Verify Model Access**

   - Ensure your Together.ai account has access to the models mentioned above
   - Some models might require specific subscription tiers

3. **Test Model Calls**

   - Create a simple test script to verify that the models are accessible:

   ```javascript
   // test-model.js
   const axios = require("axios");
   require("dotenv").config();

   async function testModel(model) {
     try {
       const response = await axios.post(
         "https://api.together.xyz/v1/chat/completions",
         {
           model: model,
           messages: [
             {
               role: "user",
               content: "Hello, can you help me with coding?",
             },
           ],
           max_tokens: 100,
         },
         {
           headers: {
             Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
             "Content-Type": "application/json",
           },
         }
       );

       console.log(`${model}: SUCCESS`);
       console.log(`Response: ${response.data.choices[0].message.content}`);
     } catch (error) {
       console.error(`${model}: FAILED`);
       console.error(error.response?.data || error.message);
     }
   }

   async function testAllModels() {
     const models = [
       "deepseek-ai/DeepSeek-R1-0528",
       "deepseek-ai/DeepSeek-V3",
       "Qwen/Qwen3-Coder-480B",
     ];

     for (const model of models) {
       await testModel(model);
     }
   }

   testAllModels();
   ```

test with:
node test-model.js

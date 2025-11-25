// Test OpenAI Agents framework directly
import { Agent, run } from '@openai/agents';

async function testBasicAgent() {
  console.log('🧪 Testing basic OpenAI Agents functionality...');

  try {
    // Create a simple test agent
    const testAgent = new Agent({
      name: 'Test Agent',
      instructions: 'You are a helpful assistant. Respond to messages appropriately.',
      model: 'gpt-4o-mini'
    });

    console.log('✅ Agent created successfully');

    // Test basic response
    const result = await run(testAgent, 'Hello, how are you?');

    console.log('✅ Agent response:', result.finalOutput);
    console.log('✅ Test passed - OpenAI Agents is working');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ OpenAI Agents not working:', error);
    return false;
  }
}

// Test SMS agent specifically
async function testSmsAgent() {
  console.log('📱 Testing SMS Agent...');

  try {
    const { smsAgent } = await import('../utils/sms-agent.js');

    console.log('✅ SMS Agent imported successfully');

    const result = await run(smsAgent, 'Customer SMS: "Hi, I need a DJ for my wedding"');

    console.log('✅ SMS Agent response:', result.finalOutput);
    console.log('✅ SMS Agent test passed');

    return true;
  } catch (error) {
    console.error('❌ SMS Agent test failed:', error.message);
    console.error('❌ Error details:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting OpenAI Agents tests...\n');

  const basicTest = await testBasicAgent();
  console.log('');

  const smsTest = await testSmsAgent();
  console.log('');

  if (basicTest && smsTest) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('💥 Some tests failed');
  }
}

runTests().catch(console.error);









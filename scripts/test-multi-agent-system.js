#!/usr/bin/env node

/**
 * Test Multi-Agent SMS System
 * Run this script to verify all agents and tools are working
 */

const testScenarios = [
  {
    name: "Availability Check",
    message: "Hi! Are you available for a wedding on June 15th, 2025?",
    expectedClassification: "check_availability",
    expectedAgent: "Availability Specialist"
  },
  {
    name: "Pricing Inquiry",
    message: "How much do you charge for wedding DJ services?",
    expectedClassification: "get_pricing",
    expectedAgent: "Pricing Specialist"
  },
  {
    name: "Ready to Book",
    message: "I want to book you for my October 12th wedding",
    expectedClassification: "book_service",
    expectedAgent: "Booking Specialist"
  },
  {
    name: "General Question",
    message: "What kind of equipment do you have?",
    expectedClassification: "general_question",
    expectedAgent: "Information Specialist"
  },
  {
    name: "Existing Customer",
    message: "Hey, following up on the quote you sent me",
    expectedClassification: "existing_customer",
    expectedAgent: "Customer Success Specialist"
  }
];

async function testMultiAgentSystem() {
  console.log('🤖 Testing Multi-Agent SMS System\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const scenario of testScenarios) {
    console.log(`\n📝 Test: ${scenario.name}`);
    console.log(`📱 Message: "${scenario.message}"`);

    try {
      // Import the workflow function
      const { runDJWorkflow } = await import('../lib/dj-agent-workflow.ts');

      // Run the workflow
      const result = await runDJWorkflow({
        phone_number: '+19015551234',  // Test phone number
        message: scenario.message
      });

      // Check results
      const classificationMatch = result.classification === scenario.expectedClassification;
      const agentMatch = result.agent_used === scenario.expectedAgent;

      if (classificationMatch && agentMatch) {
        console.log('✅ PASSED');
        console.log(`   Classification: ${result.classification} (correct)`);
        console.log(`   Agent: ${result.agent_used} (correct)`);
        console.log(`   Response: "${result.output_text.substring(0, 100)}..."`);
        passed++;
      } else {
        console.log('❌ FAILED');
        if (!classificationMatch) {
          console.log(`   Expected classification: ${scenario.expectedClassification}`);
          console.log(`   Got: ${result.classification}`);
        }
        if (!agentMatch) {
          console.log(`   Expected agent: ${scenario.expectedAgent}`);
          console.log(`   Got: ${result.agent_used}`);
        }
        failed++;
      }

      // Wait a bit to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log('❌ ERROR:', error.message);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check errors above.\n');
    process.exit(1);
  }
}

// Run tests
testMultiAgentSystem().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});


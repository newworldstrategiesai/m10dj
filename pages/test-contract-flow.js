import { useState } from 'react';
import Head from 'next/head';

export default function TestContractFlow() {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');

  const runTest = async () => {
    setStatus('running');
    setError(null);
    setResults(null);
    setCurrentStep('Starting test...');

    try {
      // Step 1: Create contact
      setCurrentStep('Step 1: Creating wedding prospect contact...');
      const contactResponse = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Emily Williams',
          email: `test.wedding.${Date.now()}@example.com`,
          phone: '9015551234',
          eventType: 'wedding',
          eventDate: '2025-08-15',
          location: 'Memphis Botanic Garden, 750 Cherry Rd, Memphis, TN 38117',
          message: 'Looking for a DJ for our wedding. Need someone who can play a mix of country, pop, and R&B.',
          guests: '200'
        })
      });

      if (!contactResponse.ok) {
        throw new Error('Failed to create contact');
      }

      const contactData = await contactResponse.json();
      console.log('Contact created:', contactData);
      setCurrentStep('Step 1: ✅ Contact created');

      // Wait a moment for contact to be fully saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Find the contact we just created
      setCurrentStep('Step 2: Finding created contact...');
      // We'll need to get the contact ID - for now, let's assume we can get it from the response
      // In a real scenario, you'd query the contacts table
      
      // For testing, let's create a manual test flow
      setCurrentStep('✅ Test setup complete!');
      setStatus('complete');
      
      setResults({
        message: 'Contact form submission successful!',
        nextSteps: [
          '1. Go to /admin/contacts to find the new contact',
          '2. Click on the contact to view details',
          '3. Go to /admin/contracts',
          '4. Click "Generate Contract" and select the contact',
          '5. Click "Send for Signature"',
          '6. Copy the signing link and open it in a new tab',
          '7. Sign the contract as the client',
          '8. Verify the contract status changed to "signed"'
        ],
        contactData
      });

    } catch (err) {
      setError(err.message);
      setStatus('error');
      setCurrentStep(`Error: ${err.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Test Contract Flow | M10 DJ Company</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              🧪 Contract Flow Test
            </h1>

            <div className="mb-6">
              <button
                onClick={runTest}
                disabled={status === 'running'}
                className="btn-primary px-6 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'running' ? 'Running Test...' : 'Start End-to-End Test'}
              </button>
            </div>

            {currentStep && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 font-medium">{currentStep}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">❌ Error: {error}</p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ {results.message}
                  </p>
                </div>

                {results.nextSteps && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Next Steps:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      {results.nextSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {results.contactData && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Contact Data:</h3>
                    <pre className="text-xs overflow-auto text-gray-700 dark:text-gray-300">
                      {JSON.stringify(results.contactData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
                📋 Manual Test Flow
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700 dark:text-yellow-300">
                <li>Go to <a href="/" className="underline">homepage</a> and fill out the contact form as a wedding prospect</li>
                <li>Submit the form</li>
                <li>Go to <a href="/admin/contacts" className="underline">/admin/contacts</a> and find your new contact</li>
                <li>Go to <a href="/admin/contracts" className="underline">/admin/contracts</a></li>
                <li>Click "Generate Contract" and select the contact</li>
                <li>Click the eye icon to preview the contract</li>
                <li>Click "Send for Signature"</li>
                <li>Copy the signing link (📋 icon)</li>
                <li>Open the link in a new tab/incognito window</li>
                <li>Review the contract and sign it</li>
                <li>Verify you receive a confirmation</li>
                <li>Go back to admin and verify the contract status is "signed"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

